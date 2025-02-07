class ActivityParticipantsController < ApplicationController
    before_action :authorized

    def invite
        activity = Activity.find(params[:activity_id])
        return render json: { error: "Activity not found" }, status: :not_found unless activity

        email = params[:email].downcase
        existing_user = User.find_by(email: email)

        existing_participant = ActivityParticipant.find_by(activity: activity, invited_email: email)
        already_joined = ActivityParticipant.find_by(activity: activity, user: existing_user)

        if existing_participant || already_joined
          return render json: { error: "This email is already invited or has joined the activity." }, status: :unprocessable_entity
        end

        if existing_user
          ActivityParticipant.create!(activity: activity, user: existing_user, accepted: true)
          UserMailer.existing_user_invite_email(existing_user, activity, current_user).deliver_later
          render json: { message: "User added and notified via email!" }, status: :ok
        else
          ActivityParticipant.create!(activity: activity, invited_email: email, accepted: false)
          UserMailer.invitation_email(email, activity, current_user).deliver_later
          render json: { message: "Invitation sent to #{email}" }, status: :ok
        end
      end
end
