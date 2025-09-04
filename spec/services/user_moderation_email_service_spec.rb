require 'rails_helper'

RSpec.describe UserModerationEmailService do
  let(:user) { create(:user) }
  let(:report) { create(:report) }

  describe 'warning email' do
    let(:service) { described_class.new(user, 'warning', report) }

    it 'sends warning email with correct content' do
      expect(service).to receive(:send_email) do |params|
        expect(params[:personalizations].first[:to].first[:email]).to eq(user.email)
        expect(params[:personalizations].first[:dynamic_template_data]).to include(
          user_name: user.name,
          action_type: 'warning',
          violation_reason: report.reason
        )
        expect(params[:from][:email]).to eq('noreply@voxxyai.com')
      end

      service.send_email
    end

    it 'includes report details when provided' do
      expect(service).to receive(:send_email) do |params|
        data = params[:personalizations].first[:dynamic_template_data]
        expect(data[:violation_details]).to include("Report ##{report.id}")
      end

      service.send_email
    end
  end

  describe 'suspension email' do
    let(:service) { described_class.new(user, 'suspended', report) }

    before do
      user.update(suspended_until: 7.days.from_now)
    end

    it 'sends suspension email with end date' do
      expect(service).to receive(:send_email) do |params|
        data = params[:personalizations].first[:dynamic_template_data]
        expect(data[:action_type]).to eq('suspended')
        expect(data[:suspension_end_date]).to be_present
      end

      service.send_email
    end
  end

  describe 'ban email' do
    let(:service) { described_class.new(user, 'banned', report) }

    before do
      user.update(ban_reason: 'Severe violation')
    end

    it 'sends ban email with appeal instructions' do
      expect(service).to receive(:send_email) do |params|
        data = params[:personalizations].first[:dynamic_template_data]
        expect(data[:action_type]).to eq('banned')
        expect(data[:ban_reason]).to eq('Severe violation')
        expect(data[:appeal_email]).to eq('support@voxxyai.com')
      end

      service.send_email
    end
  end

  describe 'basic email fallback' do
    let(:service) { described_class.new(user, 'warning', report) }

    context 'when no SendGrid template configured' do
      before do
        ENV.delete('SENDGRID_USER_MODERATION_TEMPLATE') if ENV['SENDGRID_USER_MODERATION_TEMPLATE']
      end

      it 'sends basic HTML email' do
        allow(service).to receive(:send_email) do |params|
          expect(params[:content]).to be_present
          html = params[:content].first[:value]

          expect(html).to include("Account Warning")
          expect(html).to include(user.name)
          expect(html).to include("violated our community guidelines")
        end

        service.send_email
      end

      it 'customizes content based on action type' do
        suspension_service = described_class.new(user, 'suspended', nil)
        user.update(suspended_until: 7.days.from_now)

        allow(suspension_service).to receive(:send_email) do |params|
          html = params[:content].first[:value]
          expect(html).to include("Account Suspended")
          expect(html).to include("Your account will be reinstated on")
        end

        suspension_service.send_email
      end

      it 'includes ban-specific content' do
        ban_service = described_class.new(user, 'banned', nil)
        user.update(ban_reason: 'Test reason')

        allow(ban_service).to receive(:send_email) do |params|
          html = params[:content].first[:value]
          expect(html).to include("Account Banned")
          expect(html).to include("permanently banned")
          expect(html).to include("support@voxxyai.com")
        end

        ban_service.send_email
      end
    end
  end

  describe 'error handling' do
    let(:service) { described_class.new(user, 'warning', report) }

    it 'logs error when email fails' do
      allow(service).to receive(:send_email).and_raise(StandardError.new("Email failed"))

      expect(Rails.logger).to receive(:error).with(
        "Failed to send moderation email to #{user.email}: Email failed"
      )

      service.send_email
    end
  end

  describe 'with disabled email notifications' do
    let(:service) { described_class.new(user, 'warning', report) }

    before do
      user.update(email_notifications: false)
    end

    it 'still sends moderation emails' do
      expect(service).to receive(:send_email)
      service.send_email
    end
  end
end
