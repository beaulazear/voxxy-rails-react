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

      InviteUserService.send_invitation(activity, invited_email, current_user)

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

      # Create welcome comment
      new_comment = activity.comments.create!(
        user_id: user.id,
        content: "#{user.name} has joined the chat 🎉" # 👈 Now includes user's name
        )

      # 🔥 Force reload activity to ensure new comment appears
      activity.reload

      # Return the updated activity including participants and comments
      updated_activity = {
        id: activity.id,
        activity_name: activity.activity_name,
        activity_location: activity.activity_location,
        emoji: activity.emoji,
        group_size: activity.group_size,
        date_day: activity.date_day,
        date_time: activity.date_time,
        user: activity.user ? { id: activity.user.id, name: activity.user.name, email: activity.user.email, avatar: activity.user.avatar } : nil,
        participants: activity.participants.select(:id, :name, :email, :avatar),
        completed: false,
        comments: activity.comments.order(created_at: :asc).map do |comment|
          {
            id: comment.id,
            content: comment.content,
            user_id: comment.user_id,
            created_at: comment.created_at,
            user: comment.user ? { id: comment.user.id, name: comment.user.name, avatar: comment.user.avatar } : nil
          }
        end
      }

      render json: updated_activity, status: :ok
    rescue => e
      render json: { error: e.message }, status: :unprocessable_entity
    end

    def index
      activity_participants = ActivityParticipant.includes(:activity).where("user_id = ? OR invited_email = ?", current_user.id, current_user.email)

      render json: activity_participants.as_json(
        include: {
          user: { only: [ :id, :name, :email, :avatar ] }, # Include full user data
          activity: {
            only: [ :id, :activity_name, :activity_type, :activity_location, :group_size, :date_notes, :created_at, :emoji, :completed ],
            include: { user: { only: [ :id, :name, :email, :avatar ] } }
          }
        }
      )
    end

    def leave
      activity = Activity.find_by(id: params[:activity_id])
      return render json: { error: "Activity not found" }, status: :not_found unless activity

      participant = activity.activity_participants.find_by(user_id: current_user.id)
      return render json: { error: "You are not a participant of this activity." }, status: :unprocessable_entity unless participant
      return render json: { error: "Hosts cannot leave an activity they created." }, status: :forbidden if activity.user_id == current_user.id

      Response.where(activity_id: activity.id, user_id: current_user.id).destroy_all

      participant.destroy!

      activity.update!(group_size: activity.group_size - 1)

      activity.comments.create!(
        user_id: current_user.id,
        content: "#{current_user.name} has left the chat 😢"
      )

      render json: { message: "You have successfully left the activity." }, status: :ok
    rescue => e
      render json: { error: e.message }, status: :unprocessable_entity
    end
end
