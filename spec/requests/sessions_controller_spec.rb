require 'rails_helper'

RSpec.describe SessionsController, type: :request do
  include AuthHelper

  let(:user) { create(:user, email: 'test@example.com', password: 'password123') }

  describe 'POST /login' do
    context 'with valid credentials' do
      let(:valid_credentials) do
        {
          email: 'test@example.com',
          password: 'password123'
        }
      end

      before { user } # Ensure user exists

      it 'authenticates the user and returns a token' do
        post '/login', params: valid_credentials, as: :json

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)

        expect(json).to have_key('token')
        expect(json).to have_key('user')
        expect(json['user']['email']).to eq('test@example.com')
        expect(json['token']).to be_present
      end

      it 'returns user details' do
        post '/login', params: valid_credentials, as: :json

        json = JSON.parse(response.body)
        expect(json['user']).to include(
          'id' => user.id,
          'email' => user.email
        )
      end

      it 'updates last_sign_in_at timestamp' do
        expect {
          post '/login', params: valid_credentials, as: :json
        }.to change { user.reload.last_sign_in_at }
      end
    end

    context 'with invalid email' do
      let(:invalid_email) do
        {
          email: 'wrong@example.com',
          password: 'password123'
        }
      end

      it 'returns unauthorized status' do
        post '/login', params: invalid_email, as: :json

        expect(response).to have_http_status(:unauthorized)
        json = JSON.parse(response.body)
        expect(json).to have_key('error')
      end

      it 'does not return a token' do
        post '/login', params: invalid_email, as: :json

        json = JSON.parse(response.body)
        expect(json).not_to have_key('token')
      end
    end

    context 'with invalid password' do
      let(:invalid_password) do
        {
          email: 'test@example.com',
          password: 'wrongpassword'
        }
      end

      before { user } # Ensure user exists

      it 'returns unauthorized status' do
        post '/login', params: invalid_password, as: :json

        expect(response).to have_http_status(:unauthorized)
      end

      it 'returns appropriate error message' do
        post '/login', params: invalid_password, as: :json

        json = JSON.parse(response.body)
        expect(json['error']).to include('Invalid') # "Invalid email or password"
      end
    end

    context 'with missing parameters' do
      it 'returns bad request when email is missing' do
        post '/login', params: { password: 'password123' }, as: :json

        expect(response).to have_http_status(:bad_request)
      end

      it 'returns bad request when password is missing' do
        post '/login', params: { email: 'test@example.com' }, as: :json

        expect(response).to have_http_status(:bad_request)
      end
    end

    context 'with case-insensitive email' do
      it 'authenticates regardless of email case' do
        user # Ensure user exists

        post '/login', params: {
          email: 'TEST@EXAMPLE.COM',
          password: 'password123'
        }, as: :json

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json).to have_key('token')
      end
    end

    context 'when user account is deactivated' do
      before do
        user.update(active: false) if user.respond_to?(:active)
      end

      it 'prevents login for deactivated accounts' do
        skip 'Implement if user deactivation is supported'

        post '/login', params: {
          email: 'test@example.com',
          password: 'password123'
        }, as: :json

        expect(response).to have_http_status(:unauthorized)
        json = JSON.parse(response.body)
        expect(json['error']).to include('deactivated')
      end
    end
  end

  describe 'DELETE /logout' do
    before { login_user(user) }

    context 'with valid token' do
      it 'logs out the user successfully' do
        delete '/logout', headers: auth_headers

        expect(response).to have_http_status(:success)
      end

      it 'invalidates the authentication token' do
        delete '/logout', headers: auth_headers

        # Subsequent request with same token should fail
        get '/activities', headers: auth_headers
        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'without authentication' do
      it 'returns unauthorized' do
        delete '/logout'

        expect(response).to have_http_status(:unauthorized)
      end
    end

    context 'with invalid token' do
      it 'returns unauthorized' do
        delete '/logout', headers: { 'Authorization' => 'Bearer invalid_token' }

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'Security considerations' do
    it 'does not expose sensitive information on failure' do
      post '/login', params: {
        email: 'nonexistent@example.com',
        password: 'anypassword'
      }, as: :json

      json = JSON.parse(response.body)

      # Should not reveal whether email exists or not
      expect(json['error']).not_to include('email not found')
      expect(json['error']).not_to include('user does not exist')
      # Should use generic message
      expect(json['error']).to match(/invalid/i)
    end

    it 'rate limits login attempts' do
      skip 'Implement if rate limiting is configured'

      # Make multiple failed attempts
      10.times do
        post '/login', params: {
          email: 'test@example.com',
          password: 'wrongpassword'
        }, as: :json
      end

      # Next attempt should be rate limited
      post '/login', params: {
        email: 'test@example.com',
        password: 'password123'
      }, as: :json

      expect(response).to have_http_status(:too_many_requests)
    end

    it 'sanitizes email input to prevent injection' do
      post '/login', params: {
        email: "test@example.com'; DROP TABLE users; --",
        password: 'password123'
      }, as: :json

      expect(response).to have_http_status(:unauthorized)
      # Should handle safely without SQL injection
    end
  end
end
