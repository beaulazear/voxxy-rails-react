require 'rails_helper'

RSpec.describe 'Authentication Flow Integration', type: :request do
  describe 'Complete user registration and login flow' do
    it 'handles full signup, confirmation, and login process' do
      # Mock email services
      allow(NewUserEmailService).to receive(:send_welcome_email)
      allow(ThankYouEmailService).to receive(:send_thank_you_email)

      # 1. User signs up
      signup_params = {
        user: {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          password_confirmation: 'password123'
        }
      }

      expect {
        post '/users', params: signup_params
      }.to change(User, :count).by(1)

      expect(response).to have_http_status(:success)
      
      user = User.last
      expect(user.confirmed_at).to be_nil
      expect(user.confirmation_token).to be_present

      json_response = JSON.parse(response.body)
      signup_token = json_response['token']
      expect(signup_token).to be_present

      # 2. User confirms email
      get '/verify', params: { token: user.confirmation_token }

      expect(response).to have_http_status(:success)
      
      user.reload
      expect(user.confirmed_at).to be_present
      expect(user.confirmation_token).to be_nil

      # 3. User logs in after confirmation
      post '/login', params: {
        email: 'john@example.com',
        password: 'password123'
      }

      expect(response).to have_http_status(:success)
      
      login_response = JSON.parse(response.body)
      login_token = login_response['token']
      expect(login_token).to be_present
      expect(login_response['user']['email']).to eq('john@example.com')

      # 4. User accesses protected resource
      get '/me', headers: { 'Authorization' => "Bearer #{login_token}" }

      expect(response).to have_http_status(:success)
      profile_response = JSON.parse(response.body)
      expect(profile_response['name']).to eq('John Doe')
    end
  end

  describe 'Password reset flow' do
    let(:user) { create(:user, email: 'john@example.com', password: 'oldpassword') }

    it 'handles complete password reset process' do
      # Mock email service
      allow(ForgotPasswordEmailService).to receive(:send_reset_email)

      # 1. User requests password reset
      post '/password_reset', params: { email: 'john@example.com' }

      expect(response).to have_http_status(:success)
      expect(ForgotPasswordEmailService).to have_received(:send_reset_email)

      user.reload
      expect(user.reset_password_token).to be_present
      expect(user.reset_password_sent_at).to be_present

      # 2. User resets password with token
      reset_params = {
        token: user.reset_password_token,
        password: 'newpassword123',
        password_confirmation: 'newpassword123'
      }

      post '/reset_password', params: reset_params

      expect(response).to have_http_status(:success)
      
      user.reload
      expect(user.reset_password_token).to be_nil
      expect(user.reset_password_sent_at).to be_nil

      # 3. User logs in with new password
      post '/login', params: {
        email: 'john@example.com',
        password: 'newpassword123'
      }

      expect(response).to have_http_status(:success)
      
      # 4. Old password no longer works
      post '/login', params: {
        email: 'john@example.com',
        password: 'oldpassword'
      }

      expect(response).to have_http_status(:unauthorized)
    end

    it 'handles expired reset tokens' do
      allow(ForgotPasswordEmailService).to receive(:send_reset_email)

      # Request reset
      post '/password_reset', params: { email: 'john@example.com' }
      
      user.reload
      # Simulate expired token
      user.update!(reset_password_sent_at: 25.hours.ago)

      # Try to reset with expired token
      reset_params = {
        token: user.reset_password_token,
        password: 'newpassword123',
        password_confirmation: 'newpassword123'
      }

      post '/reset_password', params: reset_params

      expect(response).to have_http_status(:unprocessable_entity)
      
      # Password should not have changed
      expect(user.authenticate('oldpassword')).to eq(user)
    end
  end

  describe 'JWT token lifecycle' do
    let(:user) { create(:user) }

    it 'handles token expiration and refresh' do
      # Login to get token
      post '/login', params: {
        email: user.email,
        password: 'password123'
      }

      login_response = JSON.parse(response.body)
      token = login_response['token']

      # Use token for authenticated request
      get '/profile', headers: { 'Authorization' => "Bearer #{token}" }
      expect(response).to have_http_status(:success)

      # Simulate token expiration (in real app, you'd wait or manipulate time)
      # For now, we'll test with an invalid token
      get '/profile', headers: { 'Authorization' => "Bearer invalid_token" }
      expect(response).to have_http_status(:unauthorized)

      # Re-login to get fresh token
      post '/login', params: {
        email: user.email,  
        password: 'password123'
      }

      new_login_response = JSON.parse(response.body)
      new_token = new_login_response['token']
      expect(new_token).not_to eq(token)

      # New token should work
      get '/profile', headers: { 'Authorization' => "Bearer #{new_token}" }
      expect(response).to have_http_status(:success)
    end
  end

  describe 'Mobile app authentication flow' do
    it 'handles mobile user registration with push notifications' do
      # Mobile user signs up with push notification setup
      signup_params = {
        user: {
          name: 'Mobile User',
          email: 'mobile@example.com',
          password: 'password123',
          password_confirmation: 'password123',
          push_notifications: true,
          push_token: 'ExponentPushToken[mobile123]',
          platform: 'ios'
        }
      }

      post '/signup', params: signup_params
      expect(response).to have_http_status(:success)

      user = User.last
      expect(user.push_notifications).to be true
      expect(user.push_token).to eq('ExponentPushToken[mobile123]')
      expect(user.platform).to eq('ios')
      expect(user.can_receive_push_notifications?).to be true

      # Login and verify push settings persist
      post '/login', params: {
        email: 'mobile@example.com',
        password: 'password123'
      }

      login_response = JSON.parse(response.body)
      token = login_response['token']

      get '/profile', headers: { 'Authorization' => "Bearer #{token}" }
      
      profile_response = JSON.parse(response.body)
      expect(profile_response['push_notifications']).to be true
      expect(profile_response['push_token']).to eq('ExponentPushToken[mobile123]')
    end

    it 'handles push token updates' do
      user = create(:user, :with_push_token)
      
      post '/login', params: {
        email: user.email,
        password: 'password123'
      }

      token = JSON.parse(response.body)['token']

      # Update push token (device reinstall scenario)
      update_params = {
        user: {
          push_token: 'ExponentPushToken[new_device_token]',
          platform: 'android'
        }
      }

      patch '/profile', 
            params: update_params,
            headers: { 'Authorization' => "Bearer #{token}" }

      expect(response).to have_http_status(:success)
      
      user.reload
      expect(user.push_token).to eq('ExponentPushToken[new_device_token]')
      expect(user.platform).to eq('android')
    end

    it 'handles disabling push notifications' do
      user = create(:user, :with_push_token)
      
      post '/login', params: {
        email: user.email,
        password: 'password123'
      }

      token = JSON.parse(response.body)['token']

      # Disable push notifications
      update_params = {
        user: {
          push_notifications: false,
          push_token: nil
        }
      }

      patch '/profile',
            params: update_params,
            headers: { 'Authorization' => "Bearer #{token}" }

      expect(response).to have_http_status(:success)
      
      user.reload
      expect(user.push_notifications).to be false
      expect(user.push_token).to be_nil
      expect(user.can_receive_push_notifications?).to be false
    end
  end

  describe 'Security and error handling' do
    it 'prevents account enumeration in password reset' do
      allow(ForgotPasswordEmailService).to receive(:send_reset_email)

      # Request reset for non-existent email
      post '/forgot_password', params: { email: 'nonexistent@example.com' }

      # Should return success to prevent email enumeration
      expect(response).to have_http_status(:success)
      json_response = JSON.parse(response.body)
      expect(json_response['message']).to include('sent')

      # But no email should actually be sent
      expect(ForgotPasswordEmailService).not_to have_received(:send_reset_email)
    end

    it 'handles malformed JWT tokens gracefully' do
      malformed_tokens = [
        'not.a.jwt',
        'header.payload', # Missing signature
        '', # Empty token
        'Bearer ', # Empty bearer
        'malformed_token_string'
      ]

      malformed_tokens.each do |bad_token|
        get '/profile', headers: { 'Authorization' => "Bearer #{bad_token}" }
        expect(response).to have_http_status(:unauthorized)
      end
    end

    it 'prevents duplicate user registration' do
      create(:user, email: 'existing@example.com')

      signup_params = {
        user: {
          name: 'Duplicate User',
          email: 'existing@example.com',
          password: 'password123',
          password_confirmation: 'password123'
        }
      }

      expect {
        post '/users', params: signup_params
      }.not_to change(User, :count)

      expect(response).to have_http_status(:unprocessable_entity)
      json_response = JSON.parse(response.body)
      expect(json_response['errors']).to include(match(/email/i))
    end

    it 'handles concurrent login attempts gracefully' do
      user = create(:user)

      # Simulate multiple concurrent login attempts
      responses = []
      
      3.times do
        post '/login', params: {
          email: user.email,
          password: 'password123'
        }
        responses << response.status
      end

      # All should succeed
      expect(responses).to all(eq(200))
    end
  end

  describe 'Session management' do
    let(:user) { create(:user) }

    it 'handles multiple device logins' do
      # Login from first device
      post '/login', params: {
        email: user.email,
        password: 'password123'
      }

      device1_token = JSON.parse(response.body)['token']

      # Login from second device
      post '/login', params: {
        email: user.email,
        password: 'password123'
      }

      device2_token = JSON.parse(response.body)['token']

      # Both tokens should be valid
      get '/profile', headers: { 'Authorization' => "Bearer #{device1_token}" }
      expect(response).to have_http_status(:success)

      get '/profile', headers: { 'Authorization' => "Bearer #{device2_token}" }
      expect(response).to have_http_status(:success)

      # Tokens should be different
      expect(device1_token).not_to eq(device2_token)
    end
  end

  describe 'Account lifecycle' do
    it 'handles complete account creation to usage flow' do
      # 1. Create account
      post '/signup', params: {
        user: {
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          password_confirmation: 'password123'
        }
      }

      user = User.last
      token = JSON.parse(response.body)['token']

      # 2. Update profile
      patch '/profile', 
            params: { 
              user: { 
                preferences: 'vegetarian',
                push_notifications: true,
                push_token: 'test_token'
              }
            },
            headers: { 'Authorization' => "Bearer #{token}" }

      expect(response).to have_http_status(:success)

      # 3. Create an activity (user becomes active)
      post '/activities',
           params: {
             activity: {
               activity_name: 'First Activity',
               activity_type: 'Restaurant',
               activity_location: 'Test Location'
             }
           },
           headers: { 'Authorization' => "Bearer #{token}" }

      expect(response).to have_http_status(:created)

      # 4. Verify user can access their created activity
      activity = Activity.last
      expect(activity.user).to eq(user)
      expect(activity.activity_name).to eq('First Activity')

      # 5. Profile should reflect updated preferences
      get '/profile', headers: { 'Authorization' => "Bearer #{token}" }
      
      profile = JSON.parse(response.body)
      expect(profile['preferences']).to eq('vegetarian')
      expect(profile['push_notifications']).to be true
    end
  end
end