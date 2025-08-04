require 'rails_helper'

RSpec.describe UsersController, type: :request do
  describe 'POST /users' do
    let(:valid_params) do
      {
        user: {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
          password_confirmation: 'password123'
        }
      }
    end

    it 'creates a new user with valid parameters' do
      expect {
        post '/users', params: valid_params
      }.to change(User, :count).by(1)

      expect(response).to have_http_status(:created)
      
      json_response = JSON.parse(response.body)
      expect(json_response).to include('id', 'name', 'email')
      
      user = User.last
      expect(user.name).to eq('John Doe')
      expect(user.email).to eq('john@example.com')
      expect(user.confirmed_at).to be_nil # Should be unconfirmed initially
    end

    it 'returns JWT token on successful signup for mobile app' do
      post '/users', params: valid_params, headers: { 'X-Mobile-App' => 'true' }

      json_response = JSON.parse(response.body)
      expect(json_response['token']).to be_present
      
      # Verify token can be decoded
      decoded_token = JWT.decode(json_response['token'], Rails.application.credentials.secret_key_base).first
      expect(decoded_token['user_id']).to eq(User.last.id)
    end

    it 'sets default notification preferences' do
      post '/users', params: valid_params

      user = User.last
      expect(user.email_notifications).to be true
      expect(user.text_notifications).to be true
      expect(user.push_notifications).to be true
      expect(user.preferences).to eq('')
    end

    context 'with invalid parameters' do
      it 'returns errors for missing name' do
        invalid_params = valid_params.deep_dup
        invalid_params[:user][:name] = ''

        expect {
          post '/users', params: invalid_params
        }.not_to change(User, :count)

        expect(response).to have_http_status(:unprocessable_entity)
        json_response = JSON.parse(response.body)
        expect(json_response['errors']).to include(match(/name/i))
      end

      it 'returns errors for invalid email' do
        invalid_params = valid_params.deep_dup
        invalid_params[:user][:email] = 'invalid-email'

        post '/users', params: invalid_params

        expect(response).to have_http_status(:unprocessable_entity)
        json_response = JSON.parse(response.body)
        expect(json_response['errors']).to include(match(/email/i))
      end

      it 'returns errors for duplicate email' do
        create(:user, email: 'john@example.com')

        post '/users', params: valid_params

        expect(response).to have_http_status(:unprocessable_entity)
        json_response = JSON.parse(response.body)
        expect(json_response['errors']).to include(match(/email/i))
      end

      it 'returns errors for short password' do
        invalid_params = valid_params.deep_dup
        invalid_params[:user][:password] = '123'
        invalid_params[:user][:password_confirmation] = '123'

        post '/users', params: invalid_params

        expect(response).to have_http_status(:unprocessable_entity)
        json_response = JSON.parse(response.body)
        expect(json_response['errors']).to include(match(/password/i))
      end

      it 'returns errors for mismatched password confirmation' do
        invalid_params = valid_params.deep_dup
        invalid_params[:user][:password_confirmation] = 'different'

        post '/users', params: invalid_params

        expect(response).to have_http_status(:unprocessable_entity)
        json_response = JSON.parse(response.body)
        expect(json_response['errors']).to include(match(/password/i))
      end
    end
  end

  describe 'POST /login' do
    let(:user) { create(:user, email: 'john@example.com', password: 'password123', confirmed_at: Time.current) }

    context 'with valid credentials' do
      before { user } # Ensure user is created
      it 'returns user and token for mobile app' do
        post '/login', params: { 
          email: 'john@example.com', 
          password: 'password123' 
        }, headers: { 'X-Mobile-App' => 'true' }

        expect(response).to have_http_status(:success)
        
        json_response = JSON.parse(response.body)
        expect(json_response).to include('token')
        expect(json_response['email']).to eq('john@example.com')
      end

      it 'returns valid JWT token for mobile app' do
        post '/login', params: { 
          email: 'john@example.com', 
          password: 'password123' 
        }, headers: { 'X-Mobile-App' => 'true' }

        json_response = JSON.parse(response.body)
        token = json_response['token']
        
        decoded_token = JWT.decode(token, Rails.application.credentials.secret_key_base).first
        expect(decoded_token['user_id']).to eq(user.id)
      end

      it 'handles case-insensitive email' do
        post '/login', params: { 
          email: 'JOHN@EXAMPLE.COM', 
          password: 'password123' 
        }

        expect(response).to have_http_status(:success)
      end
    end

    context 'with invalid credentials' do
      it 'returns error for wrong password' do
        post '/login', params: { 
          email: 'john@example.com', 
          password: 'wrongpassword' 
        }

        expect(response).to have_http_status(:unauthorized)
        json_response = JSON.parse(response.body)
        expect(json_response['error']).to be_present
      end

      it 'returns error for non-existent email' do
        post '/login', params: { 
          email: 'nonexistent@example.com', 
          password: 'password123' 
        }

        expect(response).to have_http_status(:unauthorized)
        json_response = JSON.parse(response.body)
        expect(json_response['error']).to be_present
      end

      it 'returns error for missing email' do
        post '/login', params: { password: 'password123' }

        expect(response).to have_http_status(:unauthorized)
      end

      it 'returns error for missing password' do
        post '/login', params: { email: 'john@example.com' }

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'GET /profile' do
    let(:user) { create(:user, :with_avatar) }

    context 'when authenticated' do
      before { login_user(user) }

      it 'returns user profile data' do
        get '/me', headers: auth_headers

        expect(response).to have_http_status(:success)
        
        json_response = JSON.parse(response.body)
        expect(json_response).to include(
          'id' => user.id,
          'name' => user.name,
          'email' => user.email,
          'avatar' => user.avatar
        )
      end

      it 'includes notification preferences' do
        get '/me', headers: auth_headers

        json_response = JSON.parse(response.body)
        expect(json_response).to include(
          'email_notifications',
          'text_notifications', 
          'push_notifications'
        )
      end

      it 'does not expose sensitive data' do
        get '/me', headers: auth_headers

        json_response = JSON.parse(response.body)
        expect(json_response).not_to include(
          'password_digest',
          'reset_password_token'
        )
      end
    end

    context 'when not authenticated' do
      it 'returns unauthorized' do
        get '/me'

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'PATCH /users/:id' do
    let(:user) { create(:user) }

    context 'when authenticated' do
      before { login_user(user) }

      it 'updates user profile with valid parameters' do
        update_params = {
          user: {
            name: 'Updated Name',
            preferences: 'vegetarian, no seafood',
            email_notifications: false
          }
        }

        patch "/users/#{user.id}", params: update_params, headers: auth_headers

        expect(response).to have_http_status(:success)
        
        user.reload
        expect(user.name).to eq('Updated Name')
        expect(user.preferences).to eq('vegetarian, no seafood')
        expect(user.email_notifications).to be false
      end

      it 'updates push notification settings' do
        update_params = {
          user: {
            push_notifications: false,
            push_token: nil,
            platform: nil
          }
        }

        patch "/users/#{user.id}", params: update_params, headers: auth_headers

        user.reload
        expect(user.push_notifications).to be false
        expect(user.push_token).to be_nil
        expect(user.platform).to be_nil
      end

      it 'sets up mobile push notifications' do
        update_params = {
          user: {
            push_notifications: true,
            push_token: 'ExponentPushToken[abc123]',
            platform: 'ios'
          }
        }

        patch "/users/#{user.id}", params: update_params, headers: auth_headers

        user.reload
        expect(user.push_notifications).to be true
        expect(user.push_token).to eq('ExponentPushToken[abc123]')
        expect(user.platform).to eq('ios')
      end

      it 'returns updated user data' do
        update_params = {
          user: { name: 'New Name' }
        }

        patch "/users/#{user.id}", params: update_params, headers: auth_headers

        json_response = JSON.parse(response.body)
        expect(json_response['name']).to eq('New Name')
      end

      context 'with invalid parameters' do
        it 'returns errors for invalid email' do
          update_params = {
            user: { email: 'invalid-email' }
          }

          patch "/users/#{user.id}", params: update_params, headers: auth_headers

          expect(response).to have_http_status(:unprocessable_entity)
          json_response = JSON.parse(response.body)
          expect(json_response['errors']).to be_present
        end

        it 'returns errors for duplicate email' do
          create(:user, email: 'taken@example.com')
          
          update_params = {
            user: { email: 'taken@example.com' }
          }

          patch "/users/#{user.id}", params: update_params, headers: auth_headers

          expect(response).to have_http_status(:unprocessable_entity)
        end
      end

      it 'does not allow updating sensitive fields' do
        update_params = {
          user: {
            password_digest: 'hacked',
            confirmation_token: 'hacked',
            admin: true
          }
        }

        patch "/users/#{user.id}", params: update_params, headers: auth_headers

        user.reload
        expect(user.admin).to be false
        expect(user.confirmation_token).not_to eq('hacked')
      end
    end

    context 'when not authenticated' do
      it 'returns unauthorized' do
        patch '/me', params: { user: { name: 'New Name' } }

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'password reset flow' do
    let(:user) { create(:user, email: 'john@example.com') }

    describe 'POST /password_reset' do
      before do
        # Mock email service
        allow(PasswordResetService).to receive(:send_reset_email)
      end

      it 'generates reset token for existing user' do
        post '/password_reset', params: { password_reset: { email: 'john@example.com' } }

        expect(response).to have_http_status(:ok)
        
        user.reload
        expect(user.reset_password_token).to be_present
      end

      it 'sends reset email' do
        post '/password_reset', params: { password_reset: { email: 'john@example.com' } }

        expect(PasswordResetService).to have_received(:send_reset_email)
          .with(user)
      end

      it 'returns not found for non-existent email' do
        post '/password_reset', params: { password_reset: { email: 'nonexistent@example.com' } }

        expect(response).to have_http_status(:not_found)
      end
    end

    describe 'PATCH /password_reset' do
      before do
        user.generate_password_reset_token
      end

      it 'resets password with valid token' do
        reset_params = {
          token: user.reset_password_token,
          password: 'newpassword123'
        }

        patch '/password_reset', params: reset_params

        expect(response).to have_http_status(:ok)
        
        user.reload
        expect(user.authenticate('newpassword123')).to eq(user)
      end

      it 'returns error for invalid token' do
        reset_params = {
          token: 'invalid-token',
          password: 'newpassword123',
          password_confirmation: 'newpassword123'
        }

        patch '/password_reset', params: reset_params

        expect(response).to have_http_status(:unprocessable_entity)
      end

      it 'returns error for expired token' do
        user.update!(reset_password_sent_at: 25.hours.ago)

        reset_params = {
          token: user.reset_password_token,
          password: 'newpassword123',
          password_confirmation: 'newpassword123'
        }

        patch '/password_reset', params: reset_params

        expect(response).to have_http_status(:unprocessable_entity)
      end

      it 'returns error for mismatched passwords' do
        reset_params = {
          token: user.reset_password_token,
          password: 'newpassword123',
          password_confirmation: 'different'
        }

        patch '/password_reset', params: reset_params

        expect(response).to have_http_status(:unprocessable_entity)
      end
    end
  end

  describe 'email confirmation flow' do
    let(:unconfirmed_user) { create(:user, :unconfirmed) }

    describe 'GET /verify' do
      it 'confirms user with valid token' do
        get '/verify', params: { token: unconfirmed_user.confirmation_token }

        expect(response).to have_http_status(:found) # 302 redirect
        
        unconfirmed_user.reload
        expect(unconfirmed_user.confirmed_at).to be_present
      end

      it 'returns redirect for invalid token' do
        get '/verify', params: { token: 'invalid-token' }

        expect(response).to have_http_status(:found) # 302 redirect to frontend
      end

      it 'returns redirect for already confirmed user' do
        confirmed_user = create(:user, confirmed_at: Time.current)
        
        get '/verify', params: { token: 'any-token' }

        expect(response).to have_http_status(:found) # 302 redirect to frontend
      end
    end
  end

  describe 'user data serialization' do
    let(:user) { create(:user, :with_avatar, :with_preferences) }

    before { login_user(user) }

    it 'returns properly formatted user data' do
      get '/me', headers: auth_headers

      json_response = JSON.parse(response.body)
      
      # Should include public fields
      expect(json_response).to include(
        'id', 'name', 'email', 'avatar', 'preferences',
        'email_notifications', 'text_notifications', 'push_notifications',
        'created_at'
      )
      
      # Should not include sensitive fields
      sensitive_fields = [
        'password_digest', 'reset_password_token', 'reset_password_sent_at',
        'confirmation_token', 'confirmed_at'
      ]
      sensitive_fields.each do |field|
        expect(json_response).not_to have_key(field)
      end
    end
  end
end