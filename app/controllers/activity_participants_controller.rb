class ActivityParticipantsController < ApplicationController
    before_action :authorized
    skip_before_action :authorized, only: [ :accept ]

    def invite
        activity = Activity.find_by(id: params[:activity_id])
        return render json: { error: "Activity not found" }, status: :not_found unless activity

        invited_email = params[:email]&.strip&.downcase
        return render json: { error: "Invalid email" }, status: :unprocessable_entity unless invited_email.present?

        user = User.where("lower(email) = ?", invited_email).first

        if user.nil?
          UserMailer.invitation_email(invited_email, activity, current_user).deliver_later
        else
          UserMailer.existing_user_invite_email(user, activity, current_user).deliver_later
        end

        participant = ActivityParticipant.find_or_initialize_by(activity_id: activity.id, invited_email: invited_email)
        participant.user_id = user.id if user # Associate user immediately if they exist
        participant.accepted = user.present? # If they're an existing user, auto-accept
        participant.save!

        render json: { message: "Invitation sent successfully" }, status: :ok
      end

      def accept
        invited_email = params[:email]&.strip&.downcase
        activity_id = params[:activity_id]

        participant = ActivityParticipant.find_by(invited_email: invited_email, activity_id: activity_id)

        if participant
          user = User.find_by(email: invited_email)
          participant.update(user_id: user.id, accepted: true)
          render json: { message: "Participant accepted successfully." }, status: :ok
        else
          render json: { error: "Participant not found." }, status: :not_found
        end
      end
end
