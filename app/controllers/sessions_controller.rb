class SessionsController < ApplicationController
  skip_before_action :authorized, only: [ :create ]


  def create
    user = User.includes(activities: [ :responses, :participants, :activity_participants ])
               .find_by(email: params[:email])

    if user&.authenticate(params[:password])
      session[:user_id] = user.id

      participant_activities = Activity.includes(:user, :participants)
                                       .joins(:activity_participants)
                                       .where(activity_participants: { user_id: user.id, accepted: true })
                                       .distinct

      render json: user.as_json(
        include: {
          activities: { # Activities the user owns
            only: [ :id, :activity_name, :activity_type, :activity_location, :group_size, :date_notes, :created_at, :active, :emoji ],
            include: {
              user: { only: [ :id, :name, :email ] },
              responses: { only: [ :id, :notes, :created_at ] },
              participants: { only: [ :id, :name, :email ] },
              activity_participants: { only: [ :invited_email, :accepted ] }
            }
          }
        }
      ).merge("participant_activities" => participant_activities.as_json(
        only: [ :id, :activity_name, :emoji, :user_id, :date_notes, :activity_location, :group_size ],
        include: {
          user: { only: [ :id, :name, :email ] },
          participants: { only: [ :id, :name, :email ] }
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
