require 'rails_helper'

RSpec.describe PasswordResetsController, type: :request do
  include AuthHelper
  let(:user) { create(:user, email: 'test@example.com') }

  describe 'POST /password_reset' do
    context 'with valid email' do
      before { user } # Ensure user exists

      it 'sends password reset email' do
        expect {
          post '/password_reset', params: { email: 'test@example.com' }, as: :json
        }.to change { ActionMailer::Base.deliveries.count }.by(1)

        expect(response).to have_http_status(:success)
      end

      it 'generates a password reset token' do
        post '/password_reset', params: { email: 'test@example.com' }, as: :json

        user.reload
        expect(user.reset_password_token).to be_present
        expect(user.reset_password_sent_at).to be_present
      end

      it 'returns success message' do
        post '/password_reset', params: { email: 'test@example.com' }, as: :json

        json = JSON.parse(response.body)
        expect(json['message']).to include('reset instructions')
      end

      it 'is case-insensitive for email' do
        post '/password_reset', params: { email: 'TEST@EXAMPLE.COM' }, as: :json

        expect(response).to have_http_status(:success)
        user.reload
        expect(user.reset_password_token).to be_present
      end
    end

    context 'with non-existent email' do
      it 'returns success to prevent email enumeration' do
        post '/password_reset', params: { email: 'nonexistent@example.com' }, as: :json

        # Should return success even for non-existent emails (security best practice)
        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['message']).to include('reset instructions')
      end

      it 'does not send an email' do
        expect {
          post '/password_reset', params: { email: 'nonexistent@example.com' }, as: :json
        }.not_to change { ActionMailer::Base.deliveries.count }
      end
    end

    context 'with invalid email format' do
      it 'returns validation error' do
        post '/password_reset', params: { email: 'invalid-email' }, as: :json

        expect(response).to have_http_status(:unprocessable_entity)
        json = JSON.parse(response.body)
        expect(json['error']).to include('valid email')
      end
    end

    context 'with missing email parameter' do
      it 'returns bad request' do
        post '/password_reset', params: {}, as: :json

        expect(response).to have_http_status(:bad_request)
      end
    end

    context 'rate limiting' do
      it 'prevents rapid password reset requests' do
        skip 'Implement if rate limiting is configured'

        # Make multiple requests
        5.times do
          post '/password_reset', params: { email: 'test@example.com' }, as: :json
        end

        # Next request should be rate limited
        post '/password_reset', params: { email: 'test@example.com' }, as: :json
        expect(response).to have_http_status(:too_many_requests)
      end
    end
  end

  describe 'PUT /password_reset' do
    let(:reset_token) { 'valid_reset_token_123' }

    before do
      user.update(
        reset_password_token: Digest::SHA256.hexdigest(reset_token),
        reset_password_sent_at: 1.hour.ago
      )
    end

    context 'with valid token and password' do
      let(:valid_params) do
        {
          token: reset_token,
          password: 'newpassword123',
          password_confirmation: 'newpassword123'
        }
      end

      it 'resets the password successfully' do
        put '/password_reset', params: valid_params, as: :json

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['message']).to include('successfully reset')
      end

      it 'allows login with new password' do
        put '/password_reset', params: valid_params, as: :json

        # Try logging in with new password
        post '/sessions', params: {
          email: 'test@example.com',
          password: 'newpassword123'
        }, as: :json

        expect(response).to have_http_status(:success)
      end

      it 'clears the reset token after use' do
        put '/password_reset', params: valid_params, as: :json

        user.reload
        expect(user.reset_password_token).to be_nil
        expect(user.reset_password_sent_at).to be_nil
      end

      it 'invalidates token after successful reset' do
        put '/password_reset', params: valid_params, as: :json

        # Try using the same token again
        put '/password_reset', params: valid_params, as: :json
        expect(response).to have_http_status(:unprocessable_entity)
      end
    end

    context 'with expired token' do
      before do
        user.update(
          reset_password_token: Digest::SHA256.hexdigest(reset_token),
          reset_password_sent_at: 3.hours.ago # Assuming 2-hour expiry
        )
      end

      it 'rejects expired tokens' do
        put '/password_reset', params: {
          token: reset_token,
          password: 'newpassword123',
          password_confirmation: 'newpassword123'
        }, as: :json

        expect(response).to have_http_status(:unprocessable_entity)
        json = JSON.parse(response.body)
        expect(json['error']).to include('expired')
      end
    end

    context 'with invalid token' do
      it 'returns error for non-existent token' do
        put '/password_reset', params: {
          token: 'invalid_token',
          password: 'newpassword123',
          password_confirmation: 'newpassword123'
        }, as: :json

        expect(response).to have_http_status(:unprocessable_entity)
        json = JSON.parse(response.body)
        expect(json['error']).to include('invalid')
      end
    end

    context 'with password validation' do
      it 'requires password confirmation to match' do
        put '/password_reset', params: {
          token: reset_token,
          password: 'newpassword123',
          password_confirmation: 'differentpassword'
        }, as: :json

        expect(response).to have_http_status(:unprocessable_entity)
        json = JSON.parse(response.body)
        expect(json['error']).to include('match')
      end

      it 'enforces minimum password length' do
        put '/password_reset', params: {
          token: reset_token,
          password: 'short',
          password_confirmation: 'short'
        }, as: :json

        expect(response).to have_http_status(:unprocessable_entity)
        json = JSON.parse(response.body)
        expect(json['error']).to include('too short')
      end

      it 'requires password to be present' do
        put '/password_reset', params: {
          token: reset_token,
          password: '',
          password_confirmation: ''
        }, as: :json

        expect(response).to have_http_status(:unprocessable_entity)
      end
    end

    context 'security considerations' do
      it 'does not reveal token validity in error messages' do
        put '/password_reset', params: {
          token: 'some_random_token',
          password: 'newpassword123',
          password_confirmation: 'newpassword123'
        }, as: :json

        json = JSON.parse(response.body)
        # Should not reveal whether token exists or not
        expect(json['error']).not_to include('not found')
        expect(json['error']).to match(/invalid|expired/i)
      end

      it 'prevents reuse of old reset tokens' do
        # First reset
        put '/password_reset', params: {
          token: reset_token,
          password: 'newpassword123',
          password_confirmation: 'newpassword123'
        }, as: :json

        expect(response).to have_http_status(:success)

        # Generate new reset token
        post '/password_reset', params: { email: 'test@example.com' }, as: :json

        # Try to use old token
        put '/password_reset', params: {
          token: reset_token,
          password: 'anotherpassword123',
          password_confirmation: 'anotherpassword123'
        }, as: :json

        expect(response).to have_http_status(:unprocessable_entity)
      end
    end
  end

  # Note: GET endpoint for edit doesn't exist in routes, removed these tests
end
