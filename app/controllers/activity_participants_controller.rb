class ActivityParticipantsController < ApplicationController
  before_action :authorized
  skip_before_action :authorized, only: [ :accept ]

  def invite
    activity = Activity.find_by(id: params[:activity_id])
    unless activity
      return render json: { error: "Activity not found" }, status: :not_found
    end

    raw_emails = params[:email]
    # Ensure we have an Array of strings
    emails = if raw_emails.is_a?(Array)
               raw_emails
    else
               [ raw_emails ]
    end

    # Keep track of results or errors
    results = []

    emails.each do |e|
      invited_email = e.to_s.strip.downcase
      if invited_email.blank?
        results << { email: e, error: "Invalid email" }
        next
      end

      user = User.find_by("lower(email) = ?", invited_email)

      # Try to find or build a new ActivityParticipant
      participant = ActivityParticipant.find_or_initialize_by(
        activity_id: activity.id,
        invited_email: invited_email
      )

      if participant.persisted?
        results << { email: invited_email, error: "Already invited" }
        next
      end

      participant.user_id = user.id if user
      participant.accepted = false
      if participant.save
        # fire off your mailer or service
        InviteUserService.send_invitation(activity, invited_email, current_user)
        results << { email: invited_email, status: "invited" }
      else
        results << { email: invited_email, error: participant.errors.full_messages.to_sentence }
      end
    end

    # If **all** failed, return unprocessable
    if results.all? { |r| r[:status].nil? }
      render json: { errors: results }, status: :unprocessable_entity
    else
      # Otherwise return array of results (some may be invited, some may have errors)
      render json: { results: results }, status: :ok
    end
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
    ActivityAcceptanceEmailService.send_acceptance_email(participant)

    activity = participant.activity

    new_comment = activity.comments.create!(
      user_id: user.id,
      content: "#{user.name} has joined the group 🎉"
      )

    activity.reload

    updated_activity = {
      id: activity.id,
      activity_name: activity.activity_name,
      activity_type: activity.activity_type,
      activity_location: activity.activity_location,
      emoji: activity.emoji,
      group_size: activity.group_size,
      date_notes: activity.date_notes,
      date_day: activity.date_day,
      date_time: activity.date_time,
      user: activity.user ? { id: activity.user.id, name: activity.user.name, email: activity.user.email, created_at: activity.user.created_at, avatar: activity.user.avatar } : nil,
      participants: activity.participants.select(:id, :name, :email, :avatar, :created_at),
      completed: false,
      finalized: activity.finalized,
      collecting: activity.collecting,
      voting: activity.voting,
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
    updated_activity[:responses] = activity.responses.order(created_at: :asc).map do |res|
      {
        id:         res.id,
        notes:      res.notes,
        availability: res.availability,
        user_id:    res.user_id
      }
    end

    render json: updated_activity, status: :ok
  rescue => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  def index
    activity_participants = ActivityParticipant.includes(:activity).where("user_id = ? OR invited_email = ?", current_user.id, current_user.email)

    render json: activity_participants.as_json(
      include: {
        user: { only: [ :id, :name, :email, :avatar, :created_at ] },
        activity: {
          only: [ :id, :activity_name, :activity_type, :activity_location, :group_size, :date_notes, :created_at, :emoji, :completed ],
          include: { user: { only: [ :id, :name, :email, :avatar, :created_at ] } }
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

      activity.comments.create!(
        user_id: current_user.id,
        content: "#{current_user.name} has left the chat 😢"
      )

      render json: { message: "You have successfully left the activity." }, status: :ok
    rescue => e
      render json: { error: e.message }, status: :unprocessable_entity
  end

  # DELETE /activity_participants/remove?activity_id=40&email=foo@bar.com
  def destroy_by_email
    activity = Activity.find_by(id: params[:activity_id])
    return render json: { error: "Activity not found" }, status: :not_found unless activity

    participant = activity.activity_participants.find_by(
      invited_email: params[:email].to_s.strip.downcase
    )
    return render json: { error: "Participant not found" }, status: :not_found unless participant

    unless activity.user_id == current_user.id
      return render json: { error: "Only the host can remove participants." }, status: :forbidden
    end

  Response.where(activity_id: activity.id, user_id: participant.user_id).destroy_all if participant.user_id

  participant.destroy!

  new_comment = activity.comments.create!(
    user_id: current_user.id,
    content: "#{participant.invited_email} was removed from the activity. 😢"
  )

  render json: {
    message: "Participant Removed",
    comment: new_comment.as_json(
      include: {
        user: { only: [ :id, :name, :email, :avatar ] }
      }
    )
  }, status: :created
  rescue => e
    render json: { error: e.message }, status: :unprocessable_entity
  end
end
