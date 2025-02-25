class ActivityParticipantsController < ApplicationController
    before_action :authorized
    skip_before_action :authorized, only: [ :accept ]

    def invite
      activity = Activity.find_by(id: params[:activity_id])
      return render json: { error: "Activity not found" }, status: :not_found unless activity

      invited_email = params[:email]&.strip&.downcase
      return render json: { error: "Invalid email" }, status: :unprocessable_entity unless invited_email.present?

      user = User.find_by("lower(email) = ?", invited_email)

      participant = ActivityParticipant.find_or_initialize_by(activity_id: activity.id, invited_email: invited_email)

      if participant.persisted?
        return render json: { error: "User is already invited." }, status: :unprocessable_entity
      end

      participant.user_id = user.id if user
      participant.accepted = false
      participant.save!

      if user.nil?
        UserMailer.invitation_email(invited_email, activity, current_user).deliver_later
      else
        UserMailer.existing_user_invite_email(user, activity, current_user).deliver_later
      end

      render json: participant, status: :ok
    end

    def accept
      invited_email = params[:email]&.strip&.downcase
      activity_id = params[:activity_id]

      participant = ActivityParticipant.find_by(invited_email: invited_email, activity_id: activity_id)
      return render json: { error: "Invitation not found." }, status: :not_found unless participant

      user = User.find_by(email: invited_email)
      return render json: { error: "User not found. Please register first." }, status: :not_found unless user

      if participant.accepted
        return render json: { error: "Invite already accepted." }, status: :unprocessable_entity
      end

      participant.update!(user_id: user.id, accepted: true)

      activity = participant.activity
      activity.update!(group_size: activity.group_size + 1)

      render json: { message: "You have successfully joined the activity." }, status: :ok
    rescue => e
      render json: { error: e.message }, status: :unprocessable_entity
    end

    def index
      activity_participants = ActivityParticipant.includes(:activity).where("user_id = ? OR invited_email = ?", current_user.id, current_user.email)

      render json: activity_participants.as_json(
        include: {
          activity: {
            only: [ :id, :activity_name, :activity_type, :activity_location, :group_size, :date_notes, :created_at, :emoji ],
            include: { user: { only: [ :id, :name, :email ] } }
          }
        }
      )
    end
end
