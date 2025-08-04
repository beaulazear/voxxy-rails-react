require 'rails_helper'
require Rails.root.join('lib', 'notification_helper.rb')

RSpec.describe NotificationHelper do
  let(:user) { create(:user, :with_push_token, email: 'test@example.com') }

  before do
    # Mock PushNotificationService to avoid HTTP requests
    allow(PushNotificationService).to receive(:send_notification).and_return(true)
  end

  describe '.test_push_to_user' do
    context 'when user exists and can receive notifications' do
      it 'sends test notification and returns true' do
        result = NotificationHelper.test_push_to_user('test@example.com', 'Test Title', 'Test Body')

        expect(result).to be true
        expect(PushNotificationService).to have_received(:send_notification).with(
          user,
          'Test Title',
          'Test Body',
          { type: 'manual_test', timestamp: anything }
        )
      end

      it 'uses default title and body when not provided' do
        result = NotificationHelper.test_push_to_user('test@example.com')

        expect(result).to be true
        expect(PushNotificationService).to have_received(:send_notification).with(
          user,
          'Test',
          'Test notification',
          { type: 'manual_test', timestamp: anything }
        )
      end

      it 'includes timestamp in notification data' do
        Timecop.freeze do
          NotificationHelper.test_push_to_user('test@example.com')

          expect(PushNotificationService).to have_received(:send_notification).with(
            user,
            anything,
            anything,
            { type: 'manual_test', timestamp: Time.current.to_i }
          )
        end
      end
    end

    context 'when user does not exist' do
      it 'returns false and outputs error message' do
        expect {
          result = NotificationHelper.test_push_to_user('nonexistent@example.com')
          expect(result).to be false
        }.to output(/❌ User with email nonexistent@example.com not found/).to_stdout

        expect(PushNotificationService).not_to have_received(:send_notification)
      end
    end

    context 'when user cannot receive push notifications' do
      let(:user_without_push) { create(:user, email: 'nopush@example.com', push_notifications: false) }

      it 'returns false and outputs diagnostic information' do
        expect {
          result = NotificationHelper.test_push_to_user('nopush@example.com')
          expect(result).to be false
        }.to output(/❌ User #{user_without_push.name} cannot receive push notifications/).to_stdout

        expect(PushNotificationService).not_to have_received(:send_notification)
      end

      it 'shows detailed diagnostic info' do
        user_no_token = create(:user, email: 'notoken@example.com', push_notifications: true, push_token: nil)

        expect {
          NotificationHelper.test_push_to_user('notoken@example.com')
        }.to output(/Push notifications enabled: true/).to_stdout
          .and output(/Has push token: false/).to_stdout
      end
    end

    context 'when notification sending succeeds' do
      it 'outputs success message' do
        expect {
          NotificationHelper.test_push_to_user('test@example.com')
        }.to output(/✅ Test notification sent to #{user.name}/).to_stdout
      end
    end
  end

  describe '.upcoming_activities_with_participants' do
    let(:host) { create(:user, :with_push_token) }
    let(:participant1) { create(:user, :with_push_token) }
    let(:participant2) { create(:user, push_notifications: false) }

    let!(:upcoming_activity) do
      create(:activity, :finalized,
        user: host,
        activity_name: 'Pizza Night',
        activity_type: 'Restaurant',
        date_time: 2.days.from_now
      )
    end

    let!(:past_activity) do
      create(:activity, :finalized,
        user: host,
        activity_name: 'Past Event',
        date_time: 2.days.ago
      )
    end

    before do
      # Add participants to upcoming activity
      upcoming_activity.activity_participants.create!(
        user: participant1,
        invited_email: participant1.email,
        accepted: true
      )
      upcoming_activity.activity_participants.create!(
        user: participant2,
        invited_email: participant2.email,
        accepted: true
      )
    end

    it 'displays upcoming finalized activities with participant info' do
      expect {
        NotificationHelper.upcoming_activities_with_participants
      }.to output(/📅 Upcoming Activities:/)
        .and output(/Pizza Night \(Restaurant\)/)
        .and output(/Host: #{host.name}/)
        .and output(/Participants: 3 total, 2 with push notifications/)
        .to_stdout
    end

    it 'does not show past activities' do
      expect {
        NotificationHelper.upcoming_activities_with_participants
      }.not_to output(/Past Event/).to_stdout
    end

    it 'orders activities by date' do
      # Create another upcoming activity
      later_activity = create(:activity, :finalized,
        user: host,
        activity_name: 'Later Event',
        activity_type: 'Meeting',
        date_time: 5.days.from_now
      )

      output = capture_stdout do
        NotificationHelper.upcoming_activities_with_participants
      end

      # Pizza Night (2 days) should appear before Later Event (5 days)
      pizza_position = output.index('Pizza Night')
      later_position = output.index('Later Event')
      expect(pizza_position).to be < later_position
    end

    it 'limits to 10 activities' do
      # Create 12 upcoming activities
      12.times do |i|
        create(:activity, :finalized,
          user: host,
          activity_name: "Activity #{i}",
          date_time: (i + 1).days.from_now
        )
      end

      output = capture_stdout do
        NotificationHelper.upcoming_activities_with_participants
      end

      # Should show original activity + 10 new ones (not all 12)
      activity_count = output.scan(/Activity \d+/).length
      expect(activity_count).to eq(10)
    end

    it 'handles activities with no participants' do
      solo_activity = create(:activity, :finalized,
        user: host,
        activity_name: 'Solo Activity',
        date_time: 3.days.from_now
      )

      expect {
        NotificationHelper.upcoming_activities_with_participants
      }.to output(/Solo Activity/)
        .and output(/Participants: 1 total, 1 with push notifications/)
        .to_stdout
    end

    it 'correctly counts push notification enabled participants' do
      # Create activity with mixed notification preferences
      mixed_activity = create(:activity, :finalized,
        user: create(:user, push_notifications: false), # Host without push
        activity_name: 'Mixed Activity',
        date_time: 4.days.from_now
      )

      mixed_activity.activity_participants.create!(
        user: participant1, # Has push
        invited_email: participant1.email,
        accepted: true
      )
      mixed_activity.activity_participants.create!(
        user: participant2, # No push
        invited_email: participant2.email,
        accepted: true
      )

      expect {
        NotificationHelper.upcoming_activities_with_participants
      }.to output(/Mixed Activity/)
        .and output(/Participants: 3 total, 1 with push notifications/)
        .to_stdout
    end

    it 'formats activity details correctly' do
      # Test with specific date/time formatting
      specific_time = Time.parse('2025-01-15 19:30:00')
      timed_activity = create(:activity, :finalized,
        user: host,
        activity_name: 'Timed Event',
        activity_type: 'Game Night',
        date_time: specific_time
      )

      expect {
        NotificationHelper.upcoming_activities_with_participants
      }.to output(/Timed Event \(Game Night\)/)
        .and output(/Date: #{specific_time}/)
        .to_stdout
    end
  end

  describe 'error handling' do
    it 'handles PushNotificationService errors gracefully' do
      allow(PushNotificationService).to receive(:send_notification)
        .and_raise(StandardError.new('Service error'))

      expect {
        result = NotificationHelper.test_push_to_user('test@example.com')
        expect(result).to be true # Method doesn't catch errors, lets them propagate
      }.to raise_error(StandardError, 'Service error')
    end

    it 'handles database errors in upcoming activities' do
      allow(Activity).to receive(:where).and_raise(ActiveRecord::ConnectionNotEstablished)

      expect {
        NotificationHelper.upcoming_activities_with_participants
      }.to raise_error(ActiveRecord::ConnectionNotEstablished)
    end
  end

  describe 'output formatting' do
    it 'uses proper formatting characters and spacing' do
      output = capture_stdout do
        NotificationHelper.upcoming_activities_with_participants
      end

      expect(output).to include('📅 Upcoming Activities:')
      expect(output).to include('=' * 60)
      expect(output).to match(/\s{2}Host:/) # Proper indentation
      expect(output).to match(/\s{2}Date:/)
      expect(output).to match(/\s{2}Participants:/)
    end
  end

  private

  def capture_stdout
    original_stdout = $stdout
    $stdout = StringIO.new
    yield
    $stdout.string
  ensure
    $stdout = original_stdout
  end
end