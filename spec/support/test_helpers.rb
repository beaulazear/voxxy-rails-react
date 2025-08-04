module TestHelpers
  # Shared helper methods for tests

  def travel_to_future(time)
    travel_to(time) { yield }
  end

  def json_response
    JSON.parse(response.body)
  end

  def expect_notification_sent(service_method, *args)
    expect(PushNotificationService).to have_received(service_method).with(*args)
  end

  def expect_no_notification_sent(service_method = nil)
    if service_method
      expect(PushNotificationService).not_to have_received(service_method)
    else
      %i[send_notification send_bulk_notifications send_activity_invite
         send_activity_update send_new_comment_notification
         send_venue_suggestion_notification].each do |method|
        expect(PushNotificationService).not_to have_received(method)
      end
    end
  end

  def create_activity_with_participants(host:, participants: [])
    activity = create(:activity, user: host)

    participants.each do |participant|
      activity.activity_participants.create!(
        user: participant,
        invited_email: participant.email,
        accepted: true
      )
    end

    activity
  end

  def mock_all_external_services
    allow(PushNotificationService).to receive(:send_notification)
    allow(PushNotificationService).to receive(:send_bulk_notifications)
    allow(PushNotificationService).to receive(:send_activity_invite)
    allow(PushNotificationService).to receive(:send_activity_update)
    allow(PushNotificationService).to receive(:send_new_comment_notification)
    allow(PushNotificationService).to receive(:send_venue_suggestion_notification)
    allow(PushNotificationService).to receive(:send_activity_change_notification)

    allow(ActivityFinalizationEmailService).to receive(:send_finalization_emails)
    allow(InviteUserService).to receive(:send_invitation)
    allow(ForgotPasswordEmailService).to receive(:send_reset_email)
    allow(NewUserEmailService).to receive(:send_welcome_email)
    allow(ThankYouEmailService).to receive(:send_thank_you_email)
  end

  def expect_valid_jwt_token(token)
    expect(token).to be_present

    decoded = JWT.decode(token, Rails.application.secret_key_base).first
    expect(decoded).to have_key('user_id')
    expect(decoded['user_id']).to be_a(Integer)
  end

  def create_complete_activity_workflow
    host = create(:user, :with_push_token)
    participant = create(:user, :with_push_token)

    activity = create(:activity, user: host)
    activity.activity_participants.create!(
      user: participant,
      invited_email: participant.email,
      accepted: true
    )

    venue = create(:pinned_activity, activity: activity)
    comment = create(:comment, activity: activity, user: participant)
    response = create(:response, activity: activity, user: participant)

    {
      host: host,
      participant: participant,
      activity: activity,
      venue: venue,
      comment: comment,
      response: response
    }
  end
end

RSpec.configure do |config|
  config.include TestHelpers
  config.include AuthHelper, type: :request
end
