class ActivityParticipantsController < ApplicationController
  before_action :authorized
  skip_before_action :authorized, only: [ :accept, :decline ]

  def invite
    activity = Activity.find_by(id: params[:activity_id])
    unless activity
      return render json: { error: "Activity not found" }, status: :not_found
    end

    raw_emails = params[:email]
    emails = raw_emails.is_a?(Array) ? raw_emails : [ raw_emails ]
    results = []

    emails.each do |e|
      invited_email = e.to_s.strip.downcase
      if invited_email.blank?
        results << { email: e, error: "Invalid email" }
        next
      end

      user = User.find_by("lower(email) = ?", invited_email)
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
        # Always send invitation email (contains guest response link)
        InviteUserService.send_invitation(activity, invited_email, current_user)

        # Also send push notification if the invited user has a mobile account
        if user
          Notification.send_activity_invite(activity, user)
        end

        results << { email: invited_email, status: "invited" }
      else
        results << { email: invited_email, error: participant.errors.full_messages.to_sentence }
      end
    end

    if results.all? { |r| r[:status].nil? }
      render json: { errors: results }, status: :unprocessable_entity
    else
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

    activity = participant.activity

    # Create comment but skip automatic notifications since we're sending our own
    comment = activity.comments.build(
      user_id: user.id,
      content: "#{user.name} has joined the group 🎉"
    )
    comment.skip_notifications = true
    comment.save!

    # Send push notification to the activity host when someone accepts
    Notification.create_and_send!(
      user: activity.user,
      title: "#{user.name} joined your activity! 🎉",
      body: "#{user.name} accepted your invitation to #{activity.activity_name}",
      notification_type: "participant_joined",
      activity: activity,
      triggering_user: user,
      data: {
        participantName: user.name,
        participantId: user.id.to_s
      }
    )

    activity = Activity.includes(
      :user, :participants, :activity_participants, :responses,
      { comments: :user },
      { pinned_activities: [ :votes, { comments: :user }, :voters ] }
    ).find(activity.id)

    render json: ActivitySerializer.participant_view(activity), status: :ok
  rescue => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  def decline
    invited_email = params[:email]&.strip&.downcase
    activity_id = params[:activity_id]

    participant = ActivityParticipant.find_by(invited_email: invited_email, activity_id: activity_id)
    return render json: { error: "Invitation not found." }, status: :not_found unless participant

    user = User.find_by(email: invited_email)
    return render json: { error: "User not found. Please register first." }, status: :not_found unless user

    if participant.accepted
      return render json: { error: "Cannot decline an already accepted invite." }, status: :unprocessable_entity
    end

    activity = participant.activity
    activity.comments.create!(
      user_id: user.id,
      content: "#{user.name} has declined the invitation 😔"
    )

    participant.destroy!

    render json: { message: "Invitation declined successfully." }, status: :ok
  rescue => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  def index
    activity_participants = ActivityParticipant
      .includes(activity: [ :user, :participants ])
      .where("user_id = ? OR invited_email = ?", current_user.id, current_user.email)

    render json: activity_participants.map do |ap|
      {
        id: ap.id,
        accepted: ap.accepted,
        invited_email: ap.invited_email,
        user: ap.user ? UserSerializer.basic(ap.user) : nil,
        activity: ActivitySerializer.basic(ap.activity).merge(
          user: UserSerializer.basic(ap.activity.user),
          participants: ap.activity.participants.map { |p| UserSerializer.basic(p) }
        )
      }
    end
  end

  def leave
    activity = Activity.find_by(id: params[:activity_id])
    return render json: { error: "Activity not found" }, status: :not_found unless activity

    participant = activity.activity_participants.find_by(user_id: current_user.id)
    return render json: { error: "You are not a participant of this activity." }, status: :unprocessable_entity unless participant
    return render json: { error: "Hosts cannot leave an activity they created." }, status: :forbidden if activity.user_id == current_user.id

    Response.where(activity_id: activity.id, user_id: current_user.id).destroy_all
    participant.destroy!

    # Create comment but skip automatic notifications since we're sending our own
    comment = activity.comments.build(
      user_id: current_user.id,
      content: "#{current_user.name} has left the group 😢"
    )
    comment.skip_notifications = true
    comment.save!

    # Send push notification to the activity host when someone leaves
    if activity.user_id != current_user.id
      Notification.create_and_send!(
        user: activity.user,
        title: "#{current_user.name} left your activity 😢",
        body: "#{current_user.name} has left #{activity.activity_name}",
        notification_type: "participant_left",
        activity: activity,
        triggering_user: current_user,
        data: {
          participantName: current_user.name,
          participantId: current_user.id.to_s
        }
      )
    end

    render json: { message: "You have successfully left the activity." }, status: :ok
  rescue => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

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
      comment: CommentSerializer.basic(new_comment)
    }, status: :created
  rescue => e
    render json: { error: e.message }, status: :unprocessable_entity
  end
end
