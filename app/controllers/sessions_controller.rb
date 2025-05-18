class SessionsController < ApplicationController
  skip_before_action :authorized, only: [ :create ]

  def create
    user = User.includes(
      activities: [
        { responses: :activity },
        :participants,
        :activity_participants
      ],
      activity_participants: [
        activity: [
          :responses,
          :participants
        ]
      ]
    ).find_by(email: params[:email])

    if user&.authenticate(params[:password])
      session[:user_id] = user.id

      activity_participants = ActivityParticipant.includes(activity: [ :responses, :participants ]).where("user_id = ? OR invited_email = ?", user.id, user.email)

      participant_activities = activity_participants.map(&:activity).uniq

      Rails.logger.info "User Data: #{user.as_json(include: { activities: { include: :responses } })}"

      render json: user.as_json(
        include: {
          activities: {
            only: [ :id, :activity_name, :finalized, :activity_type, :activity_location, :group_size, :date_notes, :created_at, :active, :emoji, :date_day, :date_time, :welcome_message, :completed ],
            include: {
              user: { only: [ :id, :name, :email, :avatar, :created_at ] },
              responses: { only: [ :id, :notes, :availability, :created_at, :user_id, :activity_id ] },
              participants: { only: [ :id, :name, :email, :avatar, :created_at ] },
              activity_participants: { only: [ :id, :user_id, :invited_email, :accepted ] },
              comments: { include: { user: { only: [ :id, :name, :avatar ] } } },
              pinned_activities: {
                only: [ :id, :title, :hours, :price_range, :address, :selected,
                        :description, :activity_id, :reviews, :photos, :reason, :website ],
                methods: [ :vote_count ],
                include: {
                  comments: {
                    only: [ :id, :content, :created_at ],
                    include: { user: { only: [ :id, :name, :email, :avatar ] } }
                  },
                  voters: { only: [ :id, :name, :avatar ] },
                  votes: { only: [ :id, :user_id ] }
                }
                }
            }
          }
        }
      ).merge("participant_activities" => activity_participants.as_json(
        only: [ :id, :accepted, :invited_email ],
        include: {
          activity: {
            only: [ :id, :activity_name, :finalized, :activity_type, :activity_location, :group_size, :date_notes, :created_at, :emoji, :date_day, :date_time, :welcome_message, :completed ],
            include: {
              user: { only: [ :id, :name, :email, :avatar, :created_at ] },
              responses: { only: [ :id, :notes, :availability, :created_at, :user_id, :activity_id ] },
              participants: { only: [ :id, :name, :email, :avatar, :created_at ] },
              comments: { include: { user: { only: [ :id, :name, :avatar ] } } },
              pinned_activities: {
                only: [ :id, :title, :hours, :price_range, :address, :selected,
                        :description, :activity_id, :reviews, :photos, :reason, :website ],
                methods: [ :vote_count ],
                include: {
                  comments: {
                    only: [ :id, :content, :created_at ],
                    include: { user: { only: [ :id, :name, :email, :avatar ] } }
                  },
                  voters: { only: [ :id, :name, :avatar ] },
                  votes: { only: [ :id, :user_id ] }
                }
                }
            }
          }
        }
      ))
    else
      render json: { error: "Invalid email or password" }, status: :unauthorized
    end
  end

  def destroy
    session.delete(:user_id)
    head :no_content
  end
end
