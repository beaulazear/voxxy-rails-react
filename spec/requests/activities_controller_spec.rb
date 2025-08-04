require 'rails_helper'

RSpec.describe ActivitiesController, type: :request do
  let(:user) { create(:user) }
  let(:activity) { create(:activity, user: user) }

  before do
    # Mock push notification service to avoid HTTP requests in tests
    allow(PushNotificationService).to receive(:send_test_reminder)
    allow(PushNotificationService).to receive(:send_activity_update)
    allow(PushNotificationService).to receive(:send_activity_change_notification)
  end

  describe 'GET /activities/:id/send_test_reminder' do
    context 'when user is authenticated' do
      before { login_user(user) }

      context 'when user can receive push notifications' do
        let(:user) { create(:user, :with_push_token) }

        it 'sends test reminder and returns success' do
          post "/activities/#{activity.id}/send_test_reminder", headers: auth_headers

          expect(response).to have_http_status(:success)
          expect(JSON.parse(response.body)).to include(
            'success' => true,
            'message' => 'Test reminder sent!'
          )
          expect(PushNotificationService).to have_received(:send_test_reminder)
            .with(activity, user)
        end
      end

      context 'when user cannot receive push notifications' do
        let(:user) { create(:user, push_notifications: false) }

        it 'returns error message' do
          post "/activities/#{activity.id}/send_test_reminder", headers: auth_headers

          expect(response).to have_http_status(:success)
          expect(JSON.parse(response.body)).to include(
            'success' => false,
            'message' => 'Push notifications not enabled for your account'
          )
          expect(PushNotificationService).not_to have_received(:send_test_reminder)
        end
      end
    end

    context 'when user is not authenticated' do
      it 'returns unauthorized' do
        post "/activities/#{activity.id}/send_test_reminder"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'POST /activities' do
    let(:valid_params) do
      {
        activity: {
          activity_name: 'Pizza Night',
          activity_type: 'Restaurant',
          activity_location: 'Downtown',
          group_size: '4-6 people',
          date_notes: 'This weekend',
          welcome_message: 'Looking forward to it!',
          participants: ['friend@example.com', 'buddy@example.com']
        }
      }
    end

    context 'when user is authenticated' do
      before { login_user(user) }

      it 'creates activity with valid parameters' do
        expect {
          post '/activities', params: valid_params, headers: auth_headers
        }.to change(Activity, :count).by(1)

        expect(response).to have_http_status(:created)
        
        activity = Activity.last
        expect(activity.activity_name).to eq('Pizza Night')
        expect(activity.user).to eq(user)
        expect(activity.active).to be true
      end

      it 'invites participants' do
        post '/activities', params: valid_params, headers: auth_headers

        activity = Activity.last
        expect(activity.activity_participants.count).to eq(2)
        
        emails = activity.activity_participants.pluck(:invited_email)
        expect(emails).to include('friend@example.com', 'buddy@example.com')
      end

      it 'returns activity data with associations' do
        post '/activities', params: valid_params, headers: auth_headers

        expect(response).to have_http_status(:created)
        
        json_response = JSON.parse(response.body)
        expect(json_response).to include('activity_name', 'user', 'participants')
      end

      context 'with invalid parameters' do
        let(:invalid_params) do
          {
            activity: {
              activity_name: '', # Required field missing
              activity_type: 'Restaurant'
            }
          }
        end

        it 'returns validation errors' do
          expect {
            post '/activities', params: invalid_params, headers: auth_headers
          }.not_to change(Activity, :count)

          expect(response).to have_http_status(:unprocessable_entity)
          
          json_response = JSON.parse(response.body)
          expect(json_response).to have_key('errors')
        end
      end
    end

    context 'when user is not authenticated' do
      it 'returns unauthorized' do
        post '/activities', params: valid_params

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'PATCH /activities/:id' do
    let(:update_params) do
      {
        activity: {
          activity_name: 'Updated Pizza Night',
          activity_location: 'New Location',
          group_size: '6-8 people'
        }
      }
    end

    context 'when user owns the activity' do
      before { login_user(user) }

      it 'updates activity with valid parameters' do
        patch "/activities/#{activity.id}", params: update_params, headers: auth_headers

        expect(response).to have_http_status(:ok)
        
        activity.reload
        expect(activity.activity_name).to eq('Updated Pizza Night')
        expect(activity.activity_location).to eq('New Location')
        expect(activity.group_size).to eq('6-8 people')
      end

      it 'sends change notifications to participants' do
        participant = create(:user, :with_push_token)
        activity.activity_participants.create!(
          user: participant,
          invited_email: participant.email,
          accepted: true
        )

        patch "/activities/#{activity.id}", params: update_params, headers: auth_headers

        expect(PushNotificationService).to have_received(:send_activity_change_notification)
          .with(activity, hash_including('activity_name', 'activity_location', 'group_size'))
      end

      context 'when finalizing activity' do
        let(:finalize_params) do
          {
            activity: {
              finalized: true
            }
          }
        end

        before do
          # Mock email service
          allow(ActivityFinalizationEmailService).to receive(:send_finalization_emails)
        end

        it 'sends finalization notifications' do
          patch "/activities/#{activity.id}", params: finalize_params, headers: auth_headers

          expect(response).to have_http_status(:ok)
          expect(PushNotificationService).to have_received(:send_activity_update)
            .with(activity, 'finalized')
        end

        it 'does not send change notifications when finalizing' do
          patch "/activities/#{activity.id}", params: finalize_params, headers: auth_headers

          expect(PushNotificationService).not_to have_received(:send_activity_change_notification)
        end
      end

      context 'when updating voting status' do
        let(:voting_params) do
          {
            activity: {
              voting: true
            }
          }
        end

        it 'updates voting status without change notifications' do
          patch "/activities/#{activity.id}", params: voting_params, headers: auth_headers

          expect(response).to have_http_status(:ok)
          activity.reload
          expect(activity.voting).to be true
          expect(PushNotificationService).not_to have_received(:send_activity_change_notification)
        end
      end

      context 'when selecting a venue' do
        let(:pinned_activity) { create(:pinned_activity, activity: activity) }
        let(:select_venue_params) do
          {
            activity: {
              selected_pinned_id: pinned_activity.id
            }
          }
        end

        it 'marks venue as selected' do
          patch "/activities/#{activity.id}", params: select_venue_params, headers: auth_headers

          expect(response).to have_http_status(:ok)
          pinned_activity.reload
          expect(pinned_activity.selected).to be true
        end
      end

      context 'with invalid parameters' do
        let(:invalid_params) do
          {
            activity: {
              activity_name: ''
            }
          }
        end

        it 'returns validation errors' do
          patch "/activities/#{activity.id}", params: invalid_params, headers: auth_headers

          expect(response).to have_http_status(:unprocessable_entity)
          
          json_response = JSON.parse(response.body)
          expect(json_response).to have_key('errors')
        end
      end
    end

    context 'when user does not own the activity' do
      let(:other_user) { create(:user) }
      
      before { login_user(other_user) }

      it 'returns not found' do
        patch "/activities/#{activity.id}", params: update_params, headers: auth_headers

        expect(response).to have_http_status(:not_found)
      end
    end

    context 'when user is not authenticated' do
      it 'returns unauthorized' do
        patch "/activities/#{activity.id}", params: update_params

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'DELETE /activities/:id' do
    context 'when user owns the activity' do
      before { login_user(user) }

      it 'deletes the activity' do
        activity_id = activity.id
        
        expect {
          delete "/activities/#{activity_id}", headers: auth_headers
        }.to change(Activity, :count).by(-1)

        expect(response).to have_http_status(:ok)
        expect(JSON.parse(response.body)).to include('message' => 'Activity deleted')
      end
    end

    context 'when activity does not exist' do
      before { login_user(user) }

      it 'returns not found' do
        delete '/activities/999999', headers: auth_headers

        expect(response).to have_http_status(:not_found)
        expect(JSON.parse(response.body)).to include('message' => 'Not Found')
      end
    end

    context 'when user does not own the activity' do
      let(:other_user) { create(:user) }
      
      before { login_user(other_user) }

      it 'returns not found' do
        delete "/activities/#{activity.id}", headers: auth_headers

        expect(response).to have_http_status(:not_found)
      end
    end

    context 'when user is not authenticated' do
      it 'returns unauthorized' do
        delete "/activities/#{activity.id}"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'activity workflow integration' do
    let(:participant) { create(:user, :with_push_token) }
    
    before do
      login_user(user)
      activity.activity_participants.create!(
        user: participant,
        invited_email: participant.email,
        accepted: true
      )
    end

    it 'supports complete activity lifecycle' do
      # 1. Create activity (already exists)
      expect(activity).to be_active
      expect(activity.finalized).to be false

      # 2. Start collecting responses
      patch "/activities/#{activity.id}", 
            params: { activity: { collecting: true } }, 
            headers: auth_headers
      
      activity.reload
      expect(activity.collecting).to be true

      # 3. Start voting
      patch "/activities/#{activity.id}", 
            params: { activity: { voting: true } }, 
            headers: auth_headers
      
      activity.reload
      expect(activity.voting).to be true

      # 4. Finalize activity
      allow(ActivityFinalizationEmailService).to receive(:send_finalization_emails)
      
      patch "/activities/#{activity.id}", 
            params: { activity: { finalized: true } }, 
            headers: auth_headers

      expect(response).to have_http_status(:ok)
      activity.reload
      expect(activity.finalized).to be true
      expect(PushNotificationService).to have_received(:send_activity_update)
        .with(activity, 'finalized')
    end
  end
end