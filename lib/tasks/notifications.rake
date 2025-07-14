# Create lib/tasks/notifications.rake
namespace :notifications do
  desc "Send test reminders for all upcoming activities"
  task test_reminders: :environment do
    puts "🔔 Testing activity reminders..."

    # Find activities happening in the next 24 hours
    upcoming = Activity.where(finalized: true)
                      .where("date_time > ? AND date_time < ?",
                             Time.current,
                             Time.current + 24.hours)

    if upcoming.empty?
      puts "No upcoming activities found. Creating a test activity..."

      # Find a user with push notifications enabled
      test_user = User.where(push_notifications: true)
                     .where.not(push_token: nil)
                     .first

      if test_user
        # Create a test activity 1 hour from now
        test_activity = Activity.create!(
          user: test_user,
          activity_name: "Test Activity for Reminders",
          activity_type: "Meeting",
          emoji: "⏰",
          date_day: Date.current.to_s,
          date_time: (Time.current + 1.hour).iso8601,
          finalized: true
        )

        puts "✅ Created test activity: #{test_activity.activity_name}"
        puts "   Scheduled for: #{test_activity.date_time}"

        # Send immediate test reminder
        PushNotificationService.send_test_reminder(test_activity, test_user)
        puts "✅ Sent test reminder to #{test_user.name}"
      else
        puts "❌ No users with push notifications enabled found"
      end
    else
      upcoming.each do |activity|
        participants = [ activity.user ]
        activity.participants.includes(:user).each do |p|
          participants << p.user if p.accepted?
        end

        participants.select(&:can_receive_push_notifications?).each do |user|
          PushNotificationService.send_test_reminder(activity, user)
          puts "✅ Sent test reminder for '#{activity.activity_name}' to #{user.name}"
        end
      end
    end

    puts "🎉 Test reminders complete!"
  end

  desc "List all users with push notification setup"
  task list_push_users: :environment do
    users = User.where(push_notifications: true).where.not(push_token: nil)

    puts "📱 Users with push notifications enabled:"
    puts "=" * 50

    users.each do |user|
      token_preview = user.push_token ? "#{user.push_token[0..20]}..." : "None"
      puts "#{user.name} (#{user.email})"
      puts "  Platform: #{user.platform || 'Unknown'}"
      puts "  Token: #{token_preview}"
      puts ""
    end

    puts "Total: #{users.count} users"
  end

  desc "Schedule reminders for a specific activity"
  task :schedule_for_activity, [ :activity_id ] => :environment do |task, args|
    activity_id = args[:activity_id]

    unless activity_id
      puts "❌ Please provide an activity ID: rake notifications:schedule_for_activity[123]"
      exit
    end

    activity = Activity.find_by(id: activity_id)
    unless activity
      puts "❌ Activity with ID #{activity_id} not found"
      exit
    end

    unless activity.finalized? && activity.date_time.present?
      puts "❌ Activity must be finalized with a date/time set"
      exit
    end

    # Manually trigger the reminder scheduling
    activity.send(:schedule_reminders)

    puts "✅ Scheduled reminders for activity: #{activity.activity_name}"
    puts "   Date/Time: #{activity.date_time}"
    puts "   Participants will receive reminders at:"
    puts "   - Day of activity (9 AM)"
    puts "   - 1 hour before"
    puts "   - 30 minutes before"
  end
end
