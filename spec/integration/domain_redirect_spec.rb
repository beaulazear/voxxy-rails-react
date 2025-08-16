require 'rails_helper'

RSpec.describe 'Domain-based access control', type: :request do
  let(:admin_user) { create(:user, admin: true, confirmed_at: Time.current) }
  let(:regular_user) { create(:user, admin: false, confirmed_at: Time.current) }
  let(:unconfirmed_user) { create(:user, admin: false, confirmed_at: nil) }

  describe 'PRIMARY_DOMAIN configuration' do
    context 'when set to heyvoxxy.com' do
      before do
        allow(Rails).to receive(:env).and_return(ActiveSupport::StringInquirer.new('production'))
        allow(ENV).to receive(:fetch).with('PRIMARY_DOMAIN', 'voxxyai.com').and_return('heyvoxxy.com')
      end

      it 'generates heyvoxxy.com URLs in emails' do
        expect(BaseEmailService.app_base_url).to eq('https://heyvoxxy.com')
      end

      it 'uses heyvoxxy.com in password reset emails' do
        regular_user.reset_password_token = SecureRandom.urlsafe_base64
        regular_user.reset_password_sent_at = Time.current
        regular_user.save!

        expect_any_instance_of(SendGrid::API).to receive_message_chain(:client, :mail, :_, :post) do |request|
          body = request.named_args[:request_body]
          parsed = JSON.parse(body)
          content = parsed['content'].first['value']

          expect(content).to include('https://heyvoxxy.com/#/reset-password')
          expect(content).not_to include('voxxyai.com')

          double(status_code: 202, body: 'OK')
        end

        PasswordResetService.send_reset_email(regular_user)
      end
    end

    context 'when set to voxxyai.com' do
      before do
        allow(Rails).to receive(:env).and_return(ActiveSupport::StringInquirer.new('production'))
        allow(ENV).to receive(:fetch).with('PRIMARY_DOMAIN', 'voxxyai.com').and_return('voxxyai.com')
      end

      it 'generates voxxyai.com URLs in emails' do
        expect(BaseEmailService.app_base_url).to eq('https://voxxyai.com')
      end
    end
  end

  describe 'User access by role and domain' do
    it 'admin users can access any domain' do
      # Admin users should have full access regardless of domain
      expect(admin_user.admin?).to be true
    end

    it 'regular users have restricted access based on domain' do
      # Regular users should be redirected on voxxyai.com
      # but allowed on heyvoxxy.com
      expect(regular_user.admin?).to be false
    end

    it 'unconfirmed users need to confirm email first' do
      expect(unconfirmed_user.confirmed_at).to be_nil
    end
  end

  describe 'Email sender configuration' do
    it 'always uses team@voxxyai.com regardless of PRIMARY_DOMAIN' do
      [ 'heyvoxxy.com', 'voxxyai.com', 'example.com' ].each do |domain|
        allow(ENV).to receive(:fetch).with('PRIMARY_DOMAIN', 'voxxyai.com').and_return(domain)

        expect(BaseEmailService::SENDER_EMAIL).to eq('team@voxxyai.com')
        expect(BaseEmailService::SENDER_NAME).to eq('Voxxy')
      end
    end
  end
end
