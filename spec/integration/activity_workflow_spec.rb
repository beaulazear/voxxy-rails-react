require 'rails_helper'

RSpec.describe 'Activity Workflow Integration', type: :request do
  let(:host) { create(:user, :with_push_token) }
  let(:participant1) { create(:user, :with_push_token) }
  let(:participant2) { create(:user, :with_push_token) }

  before do
    # Mock external services
    allow(PushNotificationService).to receive(:send_activity_invite)
    allow(PushNotificationService).to receive(:send_activity_update)
    allow(PushNotificationService).to receive(:send_new_comment_notification)
    allow(PushNotificationService).to receive(:send_venue_suggestion_notification)
    allow(ActivityFinalizationEmailService).to receive(:send_finalization_emails)
    allow(InviteUserService).to receive(:send_invitation)
  end

  describe 'Complete activity creation and management flow' do
    it 'handles full activity lifecycle from creation to finalization' do
      login_user(host)

      # 1. Host creates activity with participants
      activity_params = {
        activity: {
          activity_name: 'Pizza Night',
          activity_type: 'Restaurant',
          activity_location: 'Downtown Seattle',
          group_size: '4-6 people',
          date_notes: 'This Friday evening',
          welcome_message: 'Looking forward to seeing everyone!',
          participants: [ participant1.email, participant2.email ]
        }
      }

      post '/activities', params: activity_params, headers: auth_headers
      expect(response).to have_http_status(:created)

      activity = Activity.last
      expect(activity.activity_name).to eq('Pizza Night')
      expect(activity.activity_participants.count).to eq(2)

      # Verify invitations were sent
      expect(InviteUserService).to have_received(:send_invitation).twice

      # 2. Participants accept invitations
      participant1_invite = activity.activity_participants.find_by(invited_email: participant1.email)
      participant2_invite = activity.activity_participants.find_by(invited_email: participant2.email)

      # Accept first participant
      post '/activity_participants/accept', params: {
        email: participant1.email,
        activity_id: activity.id
      }
      expect(response).to have_http_status(:ok)

      participant1_invite.reload
      expect(participant1_invite.accepted).to be true

      # Accept second participant
      post '/activity_participants/accept', params: {
        email: participant2.email,
        activity_id: activity.id
      }
      expect(response).to have_http_status(:ok)

      # 3. Start collecting responses
      patch "/activities/#{activity.id}",
            params: { activity: { collecting: true } },
            headers: auth_headers

      activity.reload
      expect(activity.collecting).to be true

      # 4. Participants submit responses
      login_user(participant1)

      response_params = {
        response: {
          notes: 'I prefer vegetarian options',
          availability: {
            'friday_evening' => true,
            'saturday_evening' => false
          }
        }
      }

      post "/activities/#{activity.id}/responses",
           params: response_params,
           headers: auth_headers
      expect(response).to have_http_status(:created)

      # 5. Host suggests venues
      login_user(host)

      venue_params = {
        pinned_activity: {
          title: 'Pizza Palace',
          address: '123 Main St, Seattle, WA',
          description: 'Great wood-fired pizza',
          price_range: '$$'
        }
      }

      post "/activities/#{activity.id}/pinned_activities",
           params: venue_params,
           headers: auth_headers
      expect(response).to have_http_status(:created)

      pinned_activity = PinnedActivity.last
      expect(pinned_activity.title).to eq('Pizza Palace')

      # Verify venue suggestion notifications were sent
      expect(PushNotificationService).to have_received(:send_venue_suggestion_notification)
        .with(pinned_activity)

      # 6. Start voting phase
      patch "/activities/#{activity.id}",
            params: { activity: { voting: true } },
            headers: auth_headers

      activity.reload
      expect(activity.voting).to be true

      # 7. Participants vote on venues
      login_user(participant1)

      post "/pinned_activities/#{pinned_activity.id}/votes",
           params: { vote: { upvote: true } },
           headers: auth_headers
      expect(response).to have_http_status(:created)

      # 8. Participants comment on activity
      comment_params = {
        comment: {
          content: 'This looks great! Can\'t wait!'
        }
      }

      post "/activities/#{activity.id}/comments",
           params: comment_params,
           headers: auth_headers
      expect(response).to have_http_status(:created)

      # Verify comment notification was sent
      expect(PushNotificationService).to have_received(:send_new_comment_notification)

      # 9. Host selects venue and finalizes
      login_user(host)

      finalize_params = {
        activity: {
          selected_pinned_id: pinned_activity.id,
          finalized: true,
          date_day: 2.days.from_now.to_date,
          date_time: Time.parse('19:00')
        }
      }

      patch "/activities/#{activity.id}",
            params: finalize_params,
            headers: auth_headers
      expect(response).to have_http_status(:ok)

      activity.reload
      expect(activity.finalized).to be true

      pinned_activity.reload
      expect(pinned_activity.selected).to be true

      # Verify finalization notifications were sent
      expect(PushNotificationService).to have_received(:send_activity_update)
        .with(activity, 'finalized')
      expect(ActivityFinalizationEmailService).to have_received(:send_finalization_emails)

      # 10. Verify final activity state
      expect(activity.activity_participants.where(accepted: true).count).to eq(2)
      expect(activity.responses.count).to eq(1)
      expect(activity.pinned_activities.count).to eq(1)
      expect(activity.comments.count).to eq(1)
      expect(activity.votes.count).to eq(1)
    end
  end

  describe 'Error handling in activity workflow' do
    before { login_user(host) }

    it 'handles activity creation with invalid participant emails' do
      activity_params = {
        activity: {
          activity_name: 'Test Activity',
          activity_type: 'Restaurant',
          participants: [ 'valid@example.com', 'invalid-email', '' ]
        }
      }

      post '/activities', params: activity_params, headers: auth_headers
      expect(response).to have_http_status(:created)

      activity = Activity.last
      # Should only create participants for valid emails
      expect(activity.activity_participants.count).to eq(1)
      expect(activity.activity_participants.first.invited_email).to eq('valid@example.com')
    end

    it 'handles participant acceptance of non-existent invitation' do
      post '/activity_participants/accept', params: {
        email: 'nonexistent@example.com',
        activity_id: 999999
      }

      expect(response).to have_http_status(:not_found)
    end

    it 'prevents double acceptance of invitations' do
      activity = create(:activity, user: host)
      participant = activity.activity_participants.create!(
        invited_email: participant1.email,
        user: participant1,
        accepted: true
      )

      post '/activity_participants/accept', params: {
        email: participant1.email,
        activity_id: activity.id
      }

      expect(response).to have_http_status(:unprocessable_entity)
      json_response = JSON.parse(response.body)
      expect(json_response['error']).to include('already accepted')
    end
  end

  describe 'Permission and authorization in workflow' do
    let(:activity) { create(:activity, user: host) }
    let(:other_user) { create(:user) }

    it 'prevents non-owners from modifying activities' do
      login_user(other_user)

      patch "/activities/#{activity.id}",
            params: { activity: { activity_name: 'Hacked Name' } },
            headers: auth_headers

      expect(response).to have_http_status(:not_found)

      activity.reload
      expect(activity.activity_name).not_to eq('Hacked Name')
    end

    it 'prevents non-owners from adding venues' do
      login_user(other_user)

      venue_params = {
        pinned_activity: {
          title: 'Unauthorized Venue',
          address: '123 Hack St'
        }
      }

      post "/activities/#{activity.id}/pinned_activities",
           params: venue_params,
           headers: auth_headers

      expect(response).to have_http_status(:not_found)
    end

    it 'allows participants to comment and vote' do
      # Add participant to activity
      activity.activity_participants.create!(
        user: participant1,
        invited_email: participant1.email,
        accepted: true
      )

      venue = create(:pinned_activity, activity: activity)
      login_user(participant1)

      # Comment
      post "/activities/#{activity.id}/comments",
           params: { comment: { content: 'Great choice!' } },
           headers: auth_headers
      expect(response).to have_http_status(:created)

      # Vote
      post "/pinned_activities/#{venue.id}/votes",
           params: { vote: { upvote: true } },
           headers: auth_headers
      expect(response).to have_http_status(:created)
    end
  end

  describe 'Notification flow throughout workflow' do
    let(:activity) { create(:activity, user: host) }

    before do
      # Add participants
      activity.activity_participants.create!(
        user: participant1,
        invited_email: participant1.email,
        accepted: true
      )
      activity.activity_participants.create!(
        user: participant2,
        invited_email: participant2.email,
        accepted: true
      )
    end

    it 'sends notifications at appropriate workflow stages' do
      login_user(host)

      # Clear any setup notifications
      allow(PushNotificationService).to receive(:send_activity_invite).and_call_original
      allow(PushNotificationService).to receive(:send_activity_update).and_call_original
      allow(PushNotificationService).to receive(:send_new_comment_notification).and_call_original
      allow(PushNotificationService).to receive(:send_venue_suggestion_notification).and_call_original

      # Activity update should trigger notifications
      patch "/activities/#{activity.id}",
            params: { activity: { activity_name: 'Updated Name' } },
            headers: auth_headers

      expect(PushNotificationService).to have_received(:send_activity_change_notification)

      # Venue suggestion should trigger notifications
      venue_params = {
        pinned_activity: {
          title: 'New Venue',
          address: '123 New St'
        }
      }

      post "/activities/#{activity.id}/pinned_activities",
           params: venue_params,
           headers: auth_headers

      expect(PushNotificationService).to have_received(:send_venue_suggestion_notification)

      # Comment should trigger notifications
      login_user(participant1)

      post "/activities/#{activity.id}/comments",
           params: { comment: { content: 'Looks good!' } },
           headers: auth_headers

      expect(PushNotificationService).to have_received(:send_new_comment_notification)

      # Finalization should trigger notifications
      login_user(host)

      patch "/activities/#{activity.id}",
            params: { activity: { finalized: true } },
            headers: auth_headers

      expect(PushNotificationService).to have_received(:send_activity_update)
        .with(activity, 'finalized')
    end
  end

  describe 'Data consistency throughout workflow' do
    it 'maintains data integrity during concurrent operations' do
      login_user(host)

      # Create activity
      post '/activities', params: {
        activity: {
          activity_name: 'Concurrent Test',
          activity_type: 'Restaurant',
          participants: [ participant1.email ]
        }
      }, headers: auth_headers

      activity = Activity.last

      # Simulate concurrent operations
      # Note: In a real scenario, you'd use threads or separate processes
      # This is a simplified version to test basic data consistency

      # Accept invitation
      post '/activity_participants/accept', params: {
        email: participant1.email,
        activity_id: activity.id
      }

      # Add venue
      post "/activities/#{activity.id}/pinned_activities", params: {
        pinned_activity: {
          title: 'Test Venue',
          address: '123 Test St'
        }
      }, headers: auth_headers

      # Update activity
      patch "/activities/#{activity.id}", params: {
        activity: { collecting: true }
      }, headers: auth_headers

      # Verify final state is consistent
      activity.reload
      expect(activity.activity_participants.where(accepted: true).count).to eq(1)
      expect(activity.pinned_activities.count).to eq(1)
      expect(activity.collecting).to be true
    end
  end
end
