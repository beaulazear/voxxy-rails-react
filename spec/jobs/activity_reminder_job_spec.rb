require 'rails_helper'

RSpec.describe ActivityReminderJob, type: :job do
  let(:user_with_push) { create(:user, :with_push_token) }
  let(:activity) { create(:activity, :finalized, user: user_with_push, date_time: Time.parse('19:00')) }
  let(:participant) { create(:user, :with_push_token) }

  before do
    # Add participant to activity
    activity.activity_participants.create!(
      user: participant,
      invited_email: participant.email,
      accepted: true
    )

    # Mock PushNotificationService
    allow(PushNotificationService).to receive(:send_bulk_notifications)
  end

  describe '#perform' do
    context 'with valid finalized activity' do
      it 'processes 1 hour reminder' do
        ActivityReminderJob.perform_now(activity.id, '1_hour')

        expect(PushNotificationService).to have_received(:send_bulk_notifications) do |notifications|
          expect(notifications.length).to eq(2) # host + participant
          
          notification = notifications.first
          expect(notification[:title]).to include('Starting Soon!')
          expect(notification[:body]).to include('starts in 1 hour')
          expect(notification[:data][:type]).to eq('activity_reminder')
          expect(notification[:data][:reminderType]).to eq('1_hour')
        end
      end

      it 'processes 30 minute reminder' do
        ActivityReminderJob.perform_now(activity.id, '30_minutes')

        expect(PushNotificationService).to have_received(:send_bulk_notifications) do |notifications|
          notification = notifications.first
          expect(notification[:title]).to include('Almost Time!')
          expect(notification[:body]).to include('starts in 30 minutes')
          expect(notification[:data][:reminderType]).to eq('30_minutes')
        end
      end

      it 'processes day-of reminder' do
        ActivityReminderJob.perform_now(activity.id, 'day_of')

        expect(PushNotificationService).to have_received(:send_bulk_notifications) do |notifications|
          notification = notifications.first
          expect(notification[:title]).to include("Today's the Day!")
          expect(notification[:body]).to include('Don\'t forget:')
          expect(notification[:data][:reminderType]).to eq('day_of')
        end
      end
    end

    context 'with non-finalized activity' do
      let(:non_finalized_activity) { create(:activity, finalized: false) }

      it 'does not send reminders for non-finalized activities' do
        ActivityReminderJob.perform_now(non_finalized_activity.id, '1_hour')

        expect(PushNotificationService).not_to have_received(:send_bulk_notifications)
      end
    end

    context 'with non-existent activity' do
      it 'handles missing activity gracefully' do
        expect {
          ActivityReminderJob.perform_now(999999, '1_hour')
        }.not_to raise_error

        expect(PushNotificationService).not_to have_received(:send_bulk_notifications)
      end
    end

    context 'with invalid reminder type' do
      it 'handles unknown reminder types gracefully' do
        expect {
          ActivityReminderJob.perform_now(activity.id, 'unknown_type')
        }.not_to raise_error

        expect(PushNotificationService).not_to have_received(:send_bulk_notifications)
      end
    end
  end

  describe 'participant filtering' do
    let(:user_without_push) { create(:user, push_notifications: false) }

    before do
      # Add participant without push notifications
      activity.activity_participants.create!(
        user: user_without_push,
        invited_email: user_without_push.email,
        accepted: true
      )
    end

    it 'only includes participants who can receive push notifications' do
      ActivityReminderJob.perform_now(activity.id, '1_hour')

      expect(PushNotificationService).to have_received(:send_bulk_notifications) do |notifications|
        # Should only include host and participant with push tokens
        expect(notifications.length).to eq(2)
        
        tokens = notifications.map { |n| n[:user].push_token }
        expect(tokens).to include(user_with_push.push_token, participant.push_token)
        expect(tokens).not_to include(nil)
      end
    end
  end

  describe 'activity configuration' do
    context 'with Restaurant activity' do
      let(:restaurant_activity) { create(:activity, :finalized, activity_type: 'Restaurant') }

      it 'uses restaurant emoji and config' do
        ActivityReminderJob.perform_now(restaurant_activity.id, '1_hour')

        expect(PushNotificationService).to have_received(:send_bulk_notifications) do |notifications|
          notification = notifications.first
          expect(notification[:title]).to include('🍜')
        end
      end
    end

    context 'with Game Night activity' do
      let(:game_activity) { create(:activity, :finalized, activity_type: 'Game Night') }

      it 'uses game night emoji and config' do
        ActivityReminderJob.perform_now(game_activity.id, '1_hour')

        expect(PushNotificationService).to have_received(:send_bulk_notifications) do |notifications|
          notification = notifications.first
          expect(notification[:title]).to include('🎮')
        end
      end
    end
  end

  describe 'time formatting' do
    context 'with valid time' do
      let(:activity_with_time) { create(:activity, :finalized, date_time: Time.parse('19:30')) }

      it 'formats time correctly in day-of reminder' do
        ActivityReminderJob.perform_now(activity_with_time.id, 'day_of')

        expect(PushNotificationService).to have_received(:send_bulk_notifications) do |notifications|
          notification = notifications.first
          expect(notification[:body]).to include('7:30 PM')
        end
      end
    end

    context 'with invalid or missing time' do
      let(:activity_no_time) { create(:activity, :finalized, date_time: nil) }

      it 'handles missing time gracefully' do
        ActivityReminderJob.perform_now(activity_no_time.id, 'day_of')

        expect(PushNotificationService).to have_received(:send_bulk_notifications) do |notifications|
          notification = notifications.first
          expect(notification[:body]).to include('TBD')
        end
      end
    end
  end

  describe 'notification data structure' do
    it 'includes all required data fields' do
      ActivityReminderJob.perform_now(activity.id, '1_hour')

      expect(PushNotificationService).to have_received(:send_bulk_notifications) do |notifications|
        notification = notifications.first
        data = notification[:data]
        
        expect(data).to include(
          type: 'activity_reminder',
          activityId: activity.id.to_s,
          reminderType: '1_hour',
          activityType: activity.activity_type
        )
      end
    end

    it 'includes user objects for push token validation' do
      ActivityReminderJob.perform_now(activity.id, '1_hour')

      expect(PushNotificationService).to have_received(:send_bulk_notifications) do |notifications|
        notifications.each do |notification|
          expect(notification[:user]).to be_a(User)
          expect(notification[:user].can_receive_push_notifications?).to be true
        end
      end
    end
  end

  describe 'queue configuration' do
    it 'uses the default queue' do
      expect(ActivityReminderJob.queue_name).to eq('default')
    end
  end

  describe 'error handling' do
    context 'when PushNotificationService raises an error' do
      before do
        allow(PushNotificationService).to receive(:send_bulk_notifications)
          .and_raise(StandardError.new('Service error'))
      end

      it 'allows the error to propagate for job retry mechanism' do
        expect {
          ActivityReminderJob.perform_now(activity.id, '1_hour')
        }.to raise_error(StandardError, 'Service error')
      end
    end

    context 'when database errors occur' do
      before do
        allow(Activity).to receive(:find_by).and_raise(ActiveRecord::ConnectionNotEstablished)
      end

      it 'allows database errors to propagate' do
        expect {
          ActivityReminderJob.perform_now(activity.id, '1_hour')
        }.to raise_error(ActiveRecord::ConnectionNotEstablished)
      end
    end
  end

  describe 'participant inclusion logic' do
    let(:non_accepted_participant) { create(:user, :with_push_token) }

    before do
      # Add non-accepted participant
      activity.activity_participants.create!(
        user: non_accepted_participant,
        invited_email: non_accepted_participant.email,
        accepted: false
      )
    end

    it 'only includes accepted participants' do
      ActivityReminderJob.perform_now(activity.id, '1_hour')

      expect(PushNotificationService).to have_received(:send_bulk_notifications) do |notifications|
        # Should include host + 1 accepted participant, not the non-accepted one
        expect(notifications.length).to eq(2)
        
        user_ids = notifications.map { |n| n[:user].id }
        expect(user_ids).to include(user_with_push.id, participant.id)
        expect(user_ids).not_to include(non_accepted_participant.id)
      end
    end

    it 'always includes the activity host' do
      ActivityReminderJob.perform_now(activity.id, '1_hour')

      expect(PushNotificationService).to have_received(:send_bulk_notifications) do |notifications|
        user_ids = notifications.map { |n| n[:user].id }
        expect(user_ids).to include(activity.user_id)
      end
    end
  end
end