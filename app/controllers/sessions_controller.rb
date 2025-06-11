class SessionsController < ApplicationController
  skip_before_action :authorized, only: [ :create ]

  def create
    puts "🔎 Request Origin: #{request.headers['Origin']}"

    # eager‐load associations exactly as in UsersController#show
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
      # set web session unless mobile
      session[:user_id] = user.id unless request.headers["X-Mobile-App"] == "true"

      # build participant_activities the same way
      activity_participants = ActivityParticipant.includes(activity: [ :responses, :participants, comments: :user, pinned_activities: { comments: :user, voters: {}, votes: {} } ])
                                                 .where("user_id = ? OR invited_email = ?", user.id, user.email)
      participant_activities = activity_participants.map(&:activity).uniq

      # this is exactly the show‐action payload:
      payload = user.as_json(
        include: {
          activities: {
            only: [ :id, :activity_name, :collecting, :voting, :finalized, :activity_type, :activity_location,
                    :group_size, :radius, :date_notes, :created_at, :active, :emoji, :date_day,
                    :date_time, :welcome_message, :completed ],
            include: {
              user:      { only: [ :id, :name, :email, :avatar, :created_at ] },
              responses: { only: [ :id, :notes, :availability, :created_at, :user_id, :activity_id ] },
              participants:               { only: [ :id, :name, :email, :avatar, :created_at ] },
              activity_participants:      { only: [ :id, :user_id, :invited_email, :accepted ] },
              comments:                   { include: { user: { only: [ :id, :name, :avatar ] } } },
              pinned_activities: {
                only:   [ :id, :title, :hours, :price_range, :address, :selected,
                          :description, :activity_id, :reviews, :photos, :reason, :website ],
                methods: [ :vote_count ],
                include: {
                  comments: { only: [ :id, :content, :created_at ], include: { user: { only: [ :id, :name, :email, :avatar ] } } },
                  voters:   { only: [ :id, :name, :avatar ] },
                  votes:    { only: [ :id, :user_id ] }
                }
              }
            }
          }
        }
      ).merge(
        "participant_activities" => activity_participants.as_json(
          only: [ :id, :accepted, :invited_email ],
          include: {
            activity: {
              only: [ :id, :activity_name, :collecting, :voting, :finalized, :activity_type, :activity_location,
                      :group_size, :radius, :date_notes, :created_at, :emoji, :date_day,
                      :date_time, :welcome_message, :completed ],
              include: {
                user:      { only: [ :id, :name, :email, :avatar, :created_at ] },
                responses: { only: [ :id, :notes, :availability, :created_at, :user_id, :activity_id ] },
                participants:          { only: [ :id, :name, :email, :avatar, :created_at ] },
                comments:              { include: { user: { only: [ :id, :name, :avatar ] } } },
                pinned_activities: {
                  only:   [ :id, :title, :hours, :price_range, :address, :selected,
                            :description, :activity_id, :reviews, :photos, :reason, :website ],
                  methods: [ :vote_count ],
                  include: {
                    comments: { only: [ :id, :content, :created_at ], include: { user: { only: [ :id, :name, :email, :avatar ] } } },
                    voters:   { only: [ :id, :name, :avatar ] },
                    votes:    { only: [ :id, :user_id ] }
                  }
                }
              }
            }
          }
        )
      )

      if request.headers["X-Mobile-App"] == "true"
        # mobile: return JWT + full payload
        token = JsonWebToken.encode(user_id: user.id)
        render json: payload.merge("token" => token)
      else
        # web: just return the full payload
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
