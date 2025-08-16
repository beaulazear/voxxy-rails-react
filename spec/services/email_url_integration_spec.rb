require 'rails_helper'

RSpec.describe 'Email Service URL Integration' do
  let(:user) { create(:user, name: 'Test User', email: 'test@example.com', admin: false) }
  let(:admin) { create(:user, name: 'Admin User', email: 'admin@example.com', admin: true) }
  let(:activity) { create(:activity, user: admin, activity_name: 'Test Activity') }
  let(:participant) { create(:activity_participant, activity: activity, user: user) }

  before do
    allow(Rails).to receive(:env).and_return(ActiveSupport::StringInquirer.new('production'))
  end

  describe 'Dynamic URL generation in emails' do
    context 'with heyvoxxy.com as PRIMARY_DOMAIN' do
      around do |example|
        ClimateControl.modify PRIMARY_DOMAIN: 'heyvoxxy.com' do
          example.run
        end
      end

      it 'ActivityAcceptanceEmailService uses correct URL' do
        expect(BaseEmailService).to receive(:send_email) do |to, subject, content, headers|
          expect(content).to include('https://heyvoxxy.com/#/login')
          expect(content).not_to include('voxxyai.com')
        end

        ActivityAcceptanceEmailService.send_acceptance_email(participant)
      end

      it 'ActivityResponseEmailService uses correct URL' do
        response = create(:activity_response, activity: activity, user: user)

        expect(BaseEmailService).to receive(:send_email) do |to, subject, content, headers|
          expect(content).to include('https://heyvoxxy.com')
          expect(content).not_to include('voxxyai.com')
        end

        ActivityResponseEmailService.send_response_email(response, activity)
      end

      it 'PasswordResetService uses correct URL' do
        user.generate_password_token!

        expect_any_instance_of(SendGrid::API).to receive_message_chain(:client, :mail, :_, :post) do |request|
          body = request.named_args[:request_body]
          expect(body).to include('https://heyvoxxy.com')
          double(status_code: 202, body: 'OK')
        end

        PasswordResetService.send_reset_email(user)
      end

      it 'InviteUserService uses correct URL for new users' do
        expect(BaseEmailService).to receive(:send_email) do |to, subject, content, headers|
          expect(content).to include('https://heyvoxxy.com#/activities')
          expect(content).not_to include('voxxyai.com#/activities')
        end

        InviteUserService.send_new_user_invite('newuser@example.com', activity, admin, participant)
      end

      it 'InviteUserService uses correct URL for existing users' do
        expect(BaseEmailService).to receive(:send_email) do |to, subject, content, headers|
          expect(content).to include('https://heyvoxxy.com#/activities')
          expect(content).to include('https://heyvoxxy.com#/login')
          expect(content).not_to include('voxxyai.com')
        end

        InviteUserService.send_existing_user_invite(user, activity, admin, participant)
      end
    end

    context 'with voxxyai.com as PRIMARY_DOMAIN' do
      around do |example|
        ClimateControl.modify PRIMARY_DOMAIN: 'voxxyai.com' do
          example.run
        end
      end

      it 'uses voxxyai.com in all email URLs' do
        expect(BaseEmailService).to receive(:send_email) do |to, subject, content, headers|
          expect(content).to include('https://voxxyai.com')
          expect(content).not_to include('heyvoxxy.com')
        end

        ActivityAcceptanceEmailService.send_acceptance_email(participant)
      end
    end

    context 'without PRIMARY_DOMAIN set' do
      around do |example|
        ClimateControl.modify PRIMARY_DOMAIN: nil do
          example.run
        end
      end

      it 'defaults to voxxyai.com' do
        expect(BaseEmailService).to receive(:send_email) do |to, subject, content, headers|
          expect(content).to include('https://voxxyai.com')
        end

        ActivityAcceptanceEmailService.send_acceptance_email(participant)
      end
    end
  end

  describe 'Email sender remains unchanged' do
    it 'all services use team@voxxyai.com regardless of PRIMARY_DOMAIN' do
      ClimateControl.modify PRIMARY_DOMAIN: 'heyvoxxy.com' do
        expect(BaseEmailService::SENDER_EMAIL).to eq('team@voxxyai.com')

        # Test that emails are sent from team@voxxyai.com
        expect(BaseEmailService).to receive(:send_email) do |to, subject, content, headers|
          # The send_email method internally uses SENDER_EMAIL
          expect(BaseEmailService::SENDER_EMAIL).to eq('team@voxxyai.com')
        end

        ActivityAcceptanceEmailService.send_acceptance_email(participant)
      end
    end
  end
end
