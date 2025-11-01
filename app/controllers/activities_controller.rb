class ActivitiesController < HtmlController
  protect_from_forgery with: :exception, only: [ :share ]
  protect_from_forgery with: :null_session, if: -> { request.format.json? }

  skip_before_action :authorized, only: [ :share, :calendar ]

  def send_test_reminder
    activity = Activity.find(params[:id])

    if current_user.can_receive_push_notifications?
      PushNotificationService.send_test_reminder(activity, current_user)
      render json: { success: true, message: "Test reminder sent!" }
    else
      render json: {
        success: false,
        message: "Push notifications not enabled for your account"
      }
    end
  end

  def create
    activity = current_user.activities.build(activity_params.except(:participants))

    if activity.save
      # Create first comment for activity creation (group activities only)
      unless activity.is_solo
        formatted_date = activity.created_at.strftime("%B %d, %Y at %I:%M %p")
        comment = activity.comments.build(
          user_id: current_user.id,
          content: "#{current_user.name} created this activity on #{formatted_date} 🎊"
        )
        comment.skip_notifications = true
        comment.save!
      end

      invite_emails = activity_params[:participants] || []
      invite_emails.each { |email| invite_participant(email, activity) }

      activity = Activity.includes(:user, :participants, :activity_participants, { comments: :user })
                        .find(activity.id)

      render json: ActivitySerializer.created(activity), status: :created
    else
      render json: { errors: activity.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    activity = current_user.activities.find(params[:id])

    should_email_finalized = activity_params.key?(:finalized) && activity_params[:finalized]

    # Track changes for notifications (exclude system fields like finalized, voting, selected_pinned_id)
    notification_params = activity_params.except(:finalized, :voting, :selected_pinned_id)
    should_notify_changes = notification_params.keys.any? && !should_email_finalized

    # Track state transitions for auto-comments
    is_generating_recommendations = activity_params.key?(:voting) &&
                                    activity_params[:voting] == true &&
                                    activity_params[:collecting] == false
    is_finalizing = activity_params.key?(:finalized) && activity_params[:finalized] == true

    Activity.transaction do
      # Track changes before updating
      changes_to_notify = {}
      if should_notify_changes
        notification_params.each do |key, new_value|
          if activity.send(key) != new_value
            changes_to_notify[key.to_s] = [ activity.send(key), new_value ]
          end
        end
      end

      if activity_params.key?(:finalized)
        activity.finalized = activity_params[:finalized]
      end

      if activity_params.key?(:voting)
        activity.voting = activity_params[:voting]
      end

      if activity_params.key?(:selected_pinned_id)
        new_id = activity_params[:selected_pinned_id].to_i
        activity.pinned_activities.where(selected: true).update_all(selected: false)
        activity.pinned_activities.find(new_id).update!(selected: true)
      end

      activity.update!(activity_params.except(:finalized, :voting, :selected_pinned_id))

      # Send change notifications (only if not finalizing and there are actual changes)
      if should_notify_changes && changes_to_notify.any?
        Notification.send_activity_change(activity, changes_to_notify)

        # Create auto-comments for specific field updates (group activities only)
        unless activity.is_solo
          changes_to_notify.each do |field, (old_value, new_value)|
            comment_text = generate_update_comment(field, old_value, new_value, current_user.name)
            if comment_text
              comment = activity.comments.build(
                user_id: current_user.id,
                content: comment_text
              )
              comment.skip_notifications = true
              comment.save!
            end
          end
        end
      end

      # Auto-comment for recommendations generated (group activities only)
      if is_generating_recommendations && !activity.is_solo
        comment = activity.comments.build(
          user_id: current_user.id,
          content: "#{current_user.name} has generated new recommendations for your group! ✨"
        )
        comment.skip_notifications = true
        comment.save!

        # Send push notification to all participants (except the host who generated them)
        participants_to_notify = activity.participants.reject { |p| p.id == current_user.id }
        host_name = current_user.name.split(" ").first
        emoji = ActivityConfig.emoji_for(activity.activity_type)

        participants_to_notify.each do |participant|
          Notification.create_and_send!(
            user: participant,
            title: "New Recommendations Ready! ✨",
            body: "#{host_name} generated recommendations for #{activity.activity_name}",
            notification_type: "activity_update",
            activity: activity,
            triggering_user: current_user,
            data: {
              hostName: host_name,
              activityType: activity.activity_type,
              updateType: "recommendations_generated"
            }
          )
        end
      end

      # Auto-comment for activity finalized (group activities only)
      if is_finalizing && !activity.is_solo
        comment = activity.comments.build(
          user_id: current_user.id,
          content: "#{current_user.name} has finalized your group's plan! 🎉"
        )
        comment.skip_notifications = true
        comment.save!
      end
    end

    # Push notifications are automatically sent by the Activity model callback when finalized

    activity = Activity.includes(:user, :participants, :activity_participants, :responses, { comments: :user })
                      .find(activity.id)

    render json: ActivitySerializer.updated(activity), status: :ok

  rescue ActiveRecord::RecordInvalid => invalid
    Rails.logger.error "❌ Activity update failed: #{invalid.record.errors.full_messages}"
    render json: { errors: invalid.record.errors.full_messages }, status: :unprocessable_entity
  end

  def destroy
    activity = current_user.activities.find_by(id: params[:id])
    if activity
      activity.destroy
      render json: { message: "Activity deleted" }, status: :ok
    else
      render json: { message: "Not Found" }, status: :not_found
    end
  end

  def index
    activities = current_user.activities
                            .includes(:user, :responses, :activity_participants, :participants)

    render json: activities.map { |activity| ActivitySerializer.list_item(activity) }
  end

  def show
    unless current_user
      return render json: { error: "Not authorized" }, status: :unauthorized
    end

    # Find the specific activity with all associations
    activity = Activity.includes(
      :user, :participants, :activity_participants, :responses,
      { comments: :user },
      { pinned_activities: [ :votes, { comments: :user }, :voters ] }
    ).find_by(id: params[:id])

    unless activity
      return render json: { error: "Activity not found" }, status: :not_found
    end

    # Check authorization - owner or participant
    is_owner = activity.user_id == current_user.id
    is_participant = activity.participants.exists?(id: current_user.id) ||
                     activity.activity_participants.exists?(invited_email: current_user.email)

    unless is_owner || is_participant
      return render json: { error: "Not authorized" }, status: :unauthorized
    end

    # Return the activity using the appropriate serializer
    # Use .as_json to get a plain hash that can be modified
    if is_owner
      render json: ActivitySerializer.owned_activity(activity).as_json
    else
      activity_participant = activity.activity_participants.find_by(
        "user_id = ? OR invited_email = ?", current_user.id, current_user.email
      )
      render json: ActivitySerializer.participant_activity(activity_participant).as_json
    end
  end

  def send_thank_you
    activity = Activity.find_by(id: params[:id])
    return render json: { error: "Activity not found" }, status: :not_found unless activity

    render json: { message: "Thank-you feature disabled" }, status: :ok
  rescue => e
    render json: { error: e.message }, status: :unprocessable_entity
  end

  def mark_complete
    activity = Activity.find_by(id: params[:id])
    return render(json: { error: "Activity not found" }, status: :not_found) unless activity

    if activity.update(completed: true)
      activity = Activity.includes(:user, :participants, :activity_participants, :responses)
                        .find(activity.id)
      render json: ActivitySerializer.updated(activity), status: :ok
    else
      Rails.logger.error "❌ Activity update failed: #{activity.errors.full_messages}"
      render json: { error: activity.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def share
    @activity = Activity.includes(:participants, :time_slots, :comments)
                        .find(params[:id])

    respond_to do |format|
      format.json { render json: @activity, serializer: FinalizedActivitySerializer }
      format.html { render layout: "share" }
    end
  end

  def calendar
    @activity = Activity.find(params[:id])
    cal = Icalendar::Calendar.new

    starts = DateTime.parse("#{@activity.date_day} #{@activity.date_time.strftime('%H:%M:%S')}")
    finishes = starts + 1.hour

    cal.event do |e|
      e.dtstart     = Icalendar::Values::DateTime.new(starts, "tzid" => "America/New_York")
      e.dtend       = Icalendar::Values::DateTime.new(finishes, "tzid" => "America/New_York")
      e.summary     = @activity.activity_name
      e.description = @activity.welcome_message.to_s
      e.location    = @activity.pinned_activities.find_by(selected: true)&.address.to_s
      e.url         = share_activity_url(@activity)
    end

    cal.publish
    response.headers["Content-Type"] = "text/calendar; charset=UTF-8"
    render plain: cal.to_ical
  end

  private

  def activity_params
    params.require(:activity).permit(
      :activity_name, :collecting, :voting, :activity_type, :finalized,
      :selected_pinned_id, :activity_location, :group_size, :radius,
      :date_notes, :active, :emoji, :date_day, :date_time, :welcome_message,
      :allow_participant_time_selection, :completed, :is_solo, participants: []
    )
  end

  def generate_update_comment(field, old_value, new_value, user_name)
    case field
    when "activity_name"
      "#{user_name} updated the activity name to: \"#{new_value}\" 📝"
    when "welcome_message"
      if old_value.blank? && new_value.present?
        "#{user_name} added a welcome message 💬"
      elsif old_value.present? && new_value.blank?
        "#{user_name} removed the welcome message"
      else
        "#{user_name} updated the welcome message 💬"
      end
    when "date_day"
      if new_value.present?
        formatted_date = Date.parse(new_value.to_s).strftime("%B %d, %Y")
        "#{user_name} updated the date to #{formatted_date} 📅"
      else
        "#{user_name} removed the date"
      end
    when "date_time"
      if new_value.present?
        formatted_time = Time.parse(new_value.to_s).strftime("%I:%M %p")
        "#{user_name} updated the time to #{formatted_time} 🕐"
      else
        "#{user_name} removed the time"
      end
    when "activity_location"
      if new_value.present?
        "#{user_name} updated the location to: #{new_value} 📍"
      else
        "#{user_name} removed the location"
      end
    when "activity_type"
      emoji = ActivityConfig.emoji_for(new_value) rescue ""
      "#{user_name} changed the activity type to: #{new_value} #{emoji}"
    when "group_size"
      "#{user_name} updated the group size to #{new_value} people 👥"
    else
      # Don't create comments for other fields
      nil
    end
  rescue => e
    Rails.logger.error "Error generating update comment: #{e.message}"
    nil
  end

  def invite_participant(raw_email, activity)
    invited_email = raw_email.to_s.strip.downcase
    return if invited_email.blank?

    participant = ActivityParticipant.find_or_initialize_by(
      activity_id: activity.id,
      invited_email: invited_email
    )

    return if participant.persisted?

    if (user = User.find_by("lower(email) = ?", invited_email))
      participant.user_id = user.id
    end

    participant.accepted = false
    participant.save!

    # Always send invitation email (contains guest response link)
    InviteUserService.send_invitation(activity, invited_email, current_user)

    # Also send push notification if the invited user has a mobile account
    if user
      Notification.send_activity_invite(activity, user)
    end
  end
end
