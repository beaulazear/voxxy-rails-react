require 'rails_helper'

RSpec.describe PushNotificationService, type: :service do
  let(:user_with_push) { create(:user, :with_push_token) }
  let(:user_without_push) { create(:user, push_notifications: false) }
  let(:activity) { create(:activity, user: user_with_push) }

  # Mock HTTP requests to Expo
  before do
    stub_request(:post, "https://exp.host/--/api/v2/push/send")
      .to_return(
        status: 200,
        body: { data: [ { status: "ok" } ] }.to_json,
        headers: { 'Content-Type' => 'application/json' }
      )
  end

  describe '.send_notification' do
    context 'when user can receive push notifications' do
      it 'sends notification with correct payload' do
        PushNotificationService.send_notification(
          user_with_push,
          'Test Title',
          'Test Body',
          { type: 'test' }
        )

        expect(WebMock).to have_requested(:post, "https://exp.host/--/api/v2/push/send")
          .with(
            body: [
              {
                to: user_with_push.push_token,
                title: 'Test Title',
                body: 'Test Body',
                data: { type: 'test' },
                sound: 'default',
                badge: 1
              }
            ].to_json
          )
      end

      it 'includes default sound and badge' do
        PushNotificationService.send_notification(user_with_push, 'Title', 'Body')

        expect(WebMock).to have_requested(:post, "https://exp.host/--/api/v2/push/send")
          .with(
            body: lambda { |body|
              parsed = JSON.parse(body)
              parsed.first['sound'] == 'default' && parsed.first['badge'] == 1
            }
          )
      end
    end

    context 'when user cannot receive push notifications' do
      it 'does not send notification' do
        PushNotificationService.send_notification(user_without_push, 'Title', 'Body')

        expect(WebMock).not_to have_requested(:post, "https://exp.host/--/api/v2/push/send")
      end
    end
  end

  describe '.send_bulk_notifications' do
    let(:user2) { create(:user, :with_push_token) }
    let(:notifications) do
      [
        {
          user: user_with_push,
          title: 'Title 1',
          body: 'Body 1',
          data: { type: 'test1' }
        },
        {
          user: user2,
          title: 'Title 2',
          body: 'Body 2',
          data: { type: 'test2' }
        }
      ]
    end

    it 'sends multiple notifications in one request' do
      PushNotificationService.send_bulk_notifications(notifications)

      expect(WebMock).to have_requested(:post, "https://exp.host/--/api/v2/push/send")
        .with(
          body: [
            {
              to: user_with_push.push_token,
              title: 'Title 1',
              body: 'Body 1',
              data: { type: 'test1' },
              sound: 'default',
              badge: 1
            },
            {
              to: user2.push_token,
              title: 'Title 2',
              body: 'Body 2',
              data: { type: 'test2' },
              sound: 'default',
              badge: 1
            }
          ].to_json
        )
    end

    it 'filters out users who cannot receive notifications' do
      notifications_with_invalid_user = notifications + [
        {
          user: user_without_push,
          title: 'Filtered Title',
          body: 'Filtered Body',
          data: { type: 'filtered' }
        }
      ]

      PushNotificationService.send_bulk_notifications(notifications_with_invalid_user)

      # Should only send 2 notifications, not 3
      expect(WebMock).to have_requested(:post, "https://exp.host/--/api/v2/push/send")
        .with(
          body: lambda { |body|
            parsed = JSON.parse(body)
            parsed.length == 2
          }
        )
    end

    it 'does not make request when no valid users' do
      invalid_notifications = [
        {
          user: user_without_push,
          title: 'Title',
          body: 'Body',
          data: {}
        }
      ]

      PushNotificationService.send_bulk_notifications(invalid_notifications)

      expect(WebMock).not_to have_requested(:post, "https://exp.host/--/api/v2/push/send")
    end
  end

  describe '.send_activity_invite' do
    let(:invited_user) { create(:user, :with_push_token) }

    it 'sends invitation notification with activity details' do
      PushNotificationService.send_activity_invite(activity, invited_user)

      host_name = activity.user.name.split(" ").first
      activity_config = { emoji: "🎉", display: "Lets Meet!" } # default config

      expect(WebMock).to have_requested(:post, "https://exp.host/--/api/v2/push/send")
        .with(
          body: lambda { |body|
            parsed = JSON.parse(body)
            notification = parsed.first
            notification['to'] == invited_user.push_token &&
            notification['title'] == "🎉 New Activity Invite!" &&
            notification['body'] == "#{host_name} invited you to #{activity.activity_type.downcase}"
          }
        )
    end

    it 'uses correct emoji for restaurant activities' do
      restaurant_activity = create(:activity, activity_type: 'Restaurant')
      PushNotificationService.send_activity_invite(restaurant_activity, invited_user)

      expect(WebMock).to have_requested(:post, "https://exp.host/--/api/v2/push/send") do |request|
        body = JSON.parse(request.body)
        body.first['title'] == "🍜 New Activity Invite!"
      end
    end

    it 'does not send to users who cannot receive notifications' do
      PushNotificationService.send_activity_invite(activity, user_without_push)

      expect(WebMock).not_to have_requested(:post, "https://exp.host/--/api/v2/push/send")
    end
  end

  describe '.send_activity_update' do
    let(:participant) { create(:user, :with_push_token) }

    before do
      # Add participant to activity
      activity.activity_participants.create!(
        user: participant,
        invited_email: participant.email,
        accepted: true
      )
    end

    it 'sends finalized notification to participants' do
      PushNotificationService.send_activity_update(activity, 'finalized')

      expect(WebMock).to have_requested(:post, "https://exp.host/--/api/v2/push/send")
        .with(
          body: lambda { |body|
            parsed = JSON.parse(body)
            parsed.any? { |notification|
              notification['to'] == participant.push_token &&
              notification['title'] == "🎉 Activity Finalized!" &&
              notification['body'] == "#{activity.activity_name} is ready to go!" &&
              notification['data']['type'] == 'activity_update' &&
              notification['data']['messageType'] == 'finalized'
            }
          }
        )
    end

    it 'sends reminder notification to participants' do
      PushNotificationService.send_activity_update(activity, 'reminder')

      expect(WebMock).to have_requested(:post, "https://exp.host/--/api/v2/push/send")
        .with(
          body: lambda { |body|
            parsed = JSON.parse(body)
            parsed.any? { |notification|
              notification['title'] == "🎉 Activity Reminder" &&
              notification['body'] == "Don't forget about #{activity.activity_name}!"
            }
          }
        )
    end

    it 'includes activity host in notifications' do
      PushNotificationService.send_activity_update(activity, 'finalized')

      # Should send to both host and participant
      expect(WebMock).to have_requested(:post, "https://exp.host/--/api/v2/push/send")
        .with(
          body: lambda { |body|
            parsed = JSON.parse(body)
            tokens = parsed.map { |n| n['to'] }
            tokens.include?(user_with_push.push_token) && tokens.include?(participant.push_token)
          }
        )
    end
  end

  describe '.send_new_comment_notification' do
    let(:commenter) { create(:user, :with_push_token) }
    let(:participant) { create(:user, :with_push_token) }
    let(:comment) { create(:comment, activity: activity, user: commenter) }

    before do
      # Add participant to activity
      activity.activity_participants.create!(
        user: participant,
        invited_email: participant.email,
        accepted: true
      )
    end

    it 'notifies participants except the commenter' do
      PushNotificationService.send_new_comment_notification(comment)

      commenter_name = commenter.name.split(" ").first

      expect(WebMock).to have_requested(:post, "https://exp.host/--/api/v2/push/send")
        .with(
          body: lambda { |body|
            parsed = JSON.parse(body)
            # Should only notify participant and host, not the commenter
            tokens = parsed.map { |n| n['to'] }
            !tokens.include?(commenter.push_token)
          }
        )
    end

    it 'includes correct comment details' do
      PushNotificationService.send_new_comment_notification(comment)

      commenter_name = commenter.name.split(" ").first

      expect(WebMock).to have_requested(:post, "https://exp.host/--/api/v2/push/send")
        .with(
          body: lambda { |body|
            parsed = JSON.parse(body)
            parsed.any? { |notification|
              notification['title'] == "🎉 New Comment" &&
              notification['body'] == "#{commenter_name} commented on #{activity.activity_name}" &&
              notification['data']['type'] == 'new_comment' &&
              notification['data']['commentId'] == comment.id.to_s
            }
          }
        )
    end
  end

  describe '.send_venue_suggestion_notification' do
    let(:participant) { create(:user, :with_push_token) }
    let(:pinned_activity) { create(:pinned_activity, activity: activity) }

    before do
      activity.activity_participants.create!(
        user: participant,
        invited_email: participant.email,
        accepted: true
      )
    end

    it 'notifies all participants about new venue suggestion' do
      PushNotificationService.send_venue_suggestion_notification(pinned_activity)

      expect(WebMock).to have_requested(:post, "https://exp.host/--/api/v2/push/send")
        .with(
          body: lambda { |body|
            parsed = JSON.parse(body)
            parsed.any? { |notification|
              notification['title'] == "🎉 New Venue Suggestion!" &&
              notification['body'] == "#{pinned_activity.title} was suggested for #{activity.activity_name}" &&
              notification['data']['type'] == 'venue_suggestion' &&
              notification['data']['pinnedActivityId'] == pinned_activity.id.to_s
            }
          }
        )
    end
  end

  describe '.send_activity_change_notification' do
    let(:participant) { create(:user, :with_push_token) }
    let(:changes) { { 'activity_name' => [ 'Old Name', 'New Name' ], 'date_time' => [ 'old_time', 'new_time' ] } }

    before do
      activity.activity_participants.create!(
        user: participant,
        invited_email: participant.email,
        accepted: true
      )
    end

    it 'notifies participants except the host' do
      PushNotificationService.send_activity_change_notification(activity, changes)

      expect(WebMock).to have_requested(:post, "https://exp.host/--/api/v2/push/send")
        .with(
          body: lambda { |body|
            parsed = JSON.parse(body)
            # Should only notify participant, not the host who made the change
            tokens = parsed.map { |n| n['to'] }
            tokens.include?(participant.push_token) && !tokens.include?(user_with_push.push_token)
          }
        )
    end

    it 'formats change message correctly' do
      PushNotificationService.send_activity_change_notification(activity, changes)

      host_name = activity.user.name.split(" ").first

      expect(WebMock).to have_requested(:post, "https://exp.host/--/api/v2/push/send")
        .with(
          body: lambda { |body|
            parsed = JSON.parse(body)
            parsed.any? { |notification|
              notification['title'] == "🎉 Activity Updated" &&
              notification['body'] == "#{host_name} updated #{activity.activity_name}: name changed, date/time updated" &&
              notification['data']['type'] == 'activity_changed' &&
              notification['data']['changes'] == [ 'activity_name', 'date_time' ]
            }
          }
        )
    end
  end

  describe 'error handling' do
    context 'when Expo returns an error' do
      before do
        stub_request(:post, "https://exp.host/--/api/v2/push/send")
          .to_return(
            status: 200,
            body: {
              data: [
                {
                  status: "error",
                  message: "DeviceNotRegistered",
                  details: { error: "DeviceNotRegistered" }
                }
              ]
            }.to_json
          )
      end

      it 'handles DeviceNotRegistered error by clearing push token' do
        expect(user_with_push).to receive(:update).with(push_token: nil)
        allow(User).to receive(:find_by).with(push_token: user_with_push.push_token).and_return(user_with_push)

        PushNotificationService.send_notification(user_with_push, 'Title', 'Body')
      end
    end

    context 'when network error occurs' do
      before do
        stub_request(:post, "https://exp.host/--/api/v2/push/send")
          .to_raise(StandardError.new("Network error"))
      end

      it 'handles network errors gracefully' do
        expect {
          PushNotificationService.send_notification(user_with_push, 'Title', 'Body')
        }.not_to raise_error
      end
    end

    context 'when HTTP error occurs' do
      before do
        stub_request(:post, "https://exp.host/--/api/v2/push/send")
          .to_return(status: 500, body: "Internal Server Error")
      end

      it 'handles HTTP errors gracefully' do
        expect {
          PushNotificationService.send_notification(user_with_push, 'Title', 'Body')
        }.not_to raise_error
      end
    end
  end

  describe 'activity configuration' do
    it 'returns correct emoji for Restaurant' do
      config = PushNotificationService.send(:get_activity_config, 'Restaurant')
      expect(config[:emoji]).to eq('🍜')
    end

    it 'returns correct emoji for Meeting' do
      config = PushNotificationService.send(:get_activity_config, 'Meeting')
      expect(config[:emoji]).to eq('⏰')
    end

    it 'returns default emoji for unknown activity type' do
      config = PushNotificationService.send(:get_activity_config, 'Unknown')
      expect(config[:emoji]).to eq('🎉')
    end
  end

  describe 'change message formatting' do
    it 'formats single change correctly' do
      changes = { 'activity_name' => [ 'old', 'new' ] }
      message = PushNotificationService.send(:format_activity_changes, changes)
      expect(message).to eq('name changed')
    end

    it 'formats multiple changes correctly' do
      changes = {
        'activity_name' => [ 'old', 'new' ],
        'date_time' => [ 'old_time', 'new_time' ],
        'activity_location' => [ 'old_place', 'new_place' ]
      }
      message = PushNotificationService.send(:format_activity_changes, changes)
      expect(message).to eq('name changed, date/time updated, location changed')
    end

    it 'returns default message for unrecognized changes' do
      changes = { 'unknown_field' => [ 'old', 'new' ] }
      message = PushNotificationService.send(:format_activity_changes, changes)
      expect(message).to eq('details updated')
    end
  end
end
