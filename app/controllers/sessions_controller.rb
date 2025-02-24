class SessionsController < ApplicationController
  skip_before_action :authorized, only: [ :create ]

  def create
    user = User.includes(activities: [ :responses, :participants, :activity_participants ])
               .find_by(email: params[:email])

    if user&.authenticate(params[:password])
      session[:user_id] = user.id

      # ✅ Fetch ALL activity participants (both accepted and pending)
      activity_participants = ActivityParticipant.includes(:activity).where("user_id = ? OR invited_email = ?", user.id, user.email)

      # ✅ Extract the activities from activity_participants
      participant_activities = activity_participants.map(&:activity).uniq

      render json: user.as_json(
        include: {
          activities: { # ✅ Activities the user owns
            only: [ :id, :activity_name, :activity_type, :activity_location, :group_size, :date_notes, :created_at, :active, :emoji ],
            include: {
              user: { only: [ :id, :name, :email ] },
              responses: { only: [ :id, :notes, :created_at ] },
              participants: { only: [ :id, :name, :email ] },
              activity_participants: { only: [ :id, :user_id, :invited_email, :accepted ] }
            }
          }
        }
      ).merge("participant_activities" => activity_participants.as_json(
        only: [ :id, :accepted, :invited_email ],
        include: {
          activity: {
            only: [ :id, :activity_name, :activity_type, :activity_location, :group_size, :date_notes, :created_at, :emoji ],
            include: {
              user: { only: [ :id, :name, :email ] },
              responses: { only: [ :id, :notes, :created_at ] },
              participants: { only: [ :id, :name, :email ] }
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
