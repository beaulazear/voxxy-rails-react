# Create lib/notification_helper.rb
class NotificationHelper
  def self.test_push_to_user(user_email, title = "Test", body = "Test notification")
    user = User.find_by(email: user_email)

    unless user
      puts "❌ User with email #{user_email} not found"
      return false
    end

    unless user.can_receive_push_notifications?
      puts "❌ User #{user.name} cannot receive push notifications"
      puts "   Push notifications enabled: #{user.push_notifications}"
      puts "   Has push token: #{user.push_token.present?}"
      return false
    end

    PushNotificationService.send_notification(
      user,
      title,
      body,
      { type: "manual_test", timestamp: Time.current.to_i }
    )

    puts "✅ Test notification sent to #{user.name}"
    true
  end

  def self.upcoming_activities_with_participants
    activities = Activity.where(finalized: true)
                        .where("date_time > ?", Time.current)
                        .includes(:user, participants: :user)
                        .order(:date_time)
                        .limit(10)

    puts "📅 Upcoming Activities:"
    puts "=" * 60

    activities.each do |activity|
      puts "#{activity.activity_name} (#{activity.activity_type})"
      puts "  Host: #{activity.user.name}"
      puts "  Date: #{activity.date_time}"

      participants = [ activity.user ]
      activity.participants.each { |p| participants << p.user if p.accepted? }
      push_enabled = participants.select(&:can_receive_push_notifications?)

      puts "  Participants: #{participants.count} total, #{push_enabled.count} with push notifications"
      puts ""
    end
  end
end
