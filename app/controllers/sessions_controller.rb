class SessionsController < ApplicationController
  skip_before_action :authorized, only: [ :create ]

  def create
    puts "🔎 Request Origin: #{request.headers['Origin']}"

    user = User.includes(
      activities: [
        :responses,
        :participants,
        :activity_participants,
        comments: :user,
        pinned_activities: { comments: :user, voters: {}, votes: {} }
      ],
      activity_participants: [
        activity: [
          :responses,
          :participants,
          comments: :user,
          pinned_activities: { comments: :user, voters: {}, votes: {} }
        ]
      ]
    ).find_by(email: params[:email])

    if user&.authenticate(params[:password])
      session[:user_id] = user.id unless request.headers["X-Mobile-App"] == "true"

      activity_participants = ActivityParticipant.includes(activity: [ :responses, :participants, comments: :user, pinned_activities: { comments: :user, voters: {}, votes: {} } ])
                                                 .where("user_id = ? OR invited_email = ?", user.id, user.email)
      participant_activities = activity_participants.map(&:activity).uniq

      # Process user's activities with profile pics
      user_activities_with_pics = user.activities.map do |activity|
        activity.as_json(
          only: [ :id, :activity_name, :allow_participant_time_selection, :collecting, :voting, :finalized, :activity_type, :activity_location,
                  :group_size, :radius, :date_notes, :created_at, :active, :emoji, :date_day,
                  :date_time, :welcome_message, :completed ],
          include: {
            responses: { only: [ :id, :notes, :availability, :created_at, :user_id, :activity_id, :email ] },
            activity_participants: { only: [ :id, :user_id, :invited_email, :accepted ] }
          }
        ).merge(
          "user" => activity.user.as_json(only: [ :id, :name, :email, :avatar, :created_at ]).merge("profile_pic_url" => activity.user.profile_pic_url),
          "participants" => activity.participants.map { |p| p.as_json(only: [ :id, :name, :email, :avatar, :created_at ]).merge("profile_pic_url" => p.profile_pic_url) },
          "comments" => activity.comments.map do |comment|
            comment.as_json.merge(
              "user" => comment.user.as_json(only: [ :id, :name, :avatar ]).merge("profile_pic_url" => comment.user.profile_pic_url)
            )
          end,
          "pinned_activities" => activity.pinned_activities.map do |pinned|
            pinned.as_json(
              only: [ :id, :title, :hours, :price_range, :address, :selected,
                      :description, :activity_id, :reviews, :photos, :reason, :website ],
              methods: [ :vote_count ]
            ).merge(
              "comments" => pinned.comments.map do |comment|
                comment.as_json(only: [ :id, :content, :created_at ]).merge(
                  "user" => comment.user.as_json(only: [ :id, :name, :email, :avatar ]).merge("profile_pic_url" => comment.user.profile_pic_url)
                )
              end,
              "voters" => pinned.voters.map { |voter| voter.as_json(only: [ :id, :name, :avatar ]).merge("profile_pic_url" => voter.profile_pic_url) },
              "votes" => pinned.votes.as_json(only: [ :id, :user_id ])
            )
          end
        )
      end

      # Process participant activities with profile pics
      participant_activities_with_pics = activity_participants.map do |ap|
        activity = ap.activity
        ap.as_json(only: [ :id, :accepted, :invited_email ]).merge(
          "activity" => activity.as_json(
            only: [ :id, :activity_name, :allow_participant_time_selection, :collecting, :voting, :finalized, :activity_type, :activity_location,
                    :group_size, :radius, :date_notes, :created_at, :emoji, :date_day,
                    :date_time, :welcome_message, :completed ],
            include: {
              responses: { only: [ :id, :notes, :availability, :created_at, :email, :user_id, :activity_id ] }
            }
          ).merge(
            "user" => activity.user.as_json(only: [ :id, :name, :email, :avatar, :created_at ]).merge("profile_pic_url" => activity.user.profile_pic_url),
            "participants" => activity.participants.map { |p| p.as_json(only: [ :id, :name, :email, :avatar, :created_at ]).merge("profile_pic_url" => p.profile_pic_url) },
            "comments" => activity.comments.map do |comment|
              comment.as_json.merge(
                "user" => comment.user.as_json(only: [ :id, :name, :avatar ]).merge("profile_pic_url" => comment.user.profile_pic_url)
              )
            end,
            "pinned_activities" => activity.pinned_activities.map do |pinned|
              pinned.as_json(
                only: [ :id, :title, :hours, :price_range, :address, :selected,
                        :description, :activity_id, :reviews, :photos, :reason, :website ],
                methods: [ :vote_count ]
              ).merge(
                "comments" => pinned.comments.map do |comment|
                  comment.as_json(only: [ :id, :content, :created_at ]).merge(
                    "user" => comment.user.as_json(only: [ :id, :name, :email, :avatar ]).merge("profile_pic_url" => comment.user.profile_pic_url)
                  )
                end,
                "voters" => pinned.voters.map { |voter| voter.as_json(only: [ :id, :name, :avatar ]).merge("profile_pic_url" => voter.profile_pic_url) },
                "votes" => pinned.votes.as_json(only: [ :id, :user_id ])
              )
            end
          )
        )
      end

      payload = user.as_json.merge(
        "profile_pic_url" => user.profile_pic_url,
        "activities" => user_activities_with_pics,
        "participant_activities" => participant_activities_with_pics
      )

      if request.headers["X-Mobile-App"] == "true"
        token = JsonWebToken.encode(user_id: user.id)
        render json: payload.merge("token" => token)
      else
        render json: payload
      end

    else
      render json: { error: "Invalid email or password" }, status: :unauthorized
    end
  end

  def destroy
    session.delete(:user_id)
    head :no_content
  end
end
