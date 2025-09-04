require 'rails_helper'

RSpec.describe ReportNotificationService do
  let(:reporter) { create(:user) }
  let(:reported_user) { create(:user) }
  let(:comment) { create(:comment, user: reported_user, content: "Test comment content") }
  let(:report) { create(:report, reporter: reporter, reportable: comment, reason: 'harassment', description: 'This is harassment') }
  let(:service) { described_class.new(report) }

  describe '#send_admin_notification' do
    let!(:admin1) { create(:user, admin: true, email_notifications: true) }
    let!(:admin2) { create(:user, admin: true, email_notifications: true) }
    let!(:admin_no_notifications) { create(:user, admin: true, email_notifications: false) }

    context 'when sending to admins with notifications enabled' do
      it 'sends email to all admins with notifications enabled' do
        expect(service).to receive(:send_email_to_admin).with(admin1)
        expect(service).to receive(:send_email_to_admin).with(admin2)
        expect(service).not_to receive(:send_email_to_admin).with(admin_no_notifications)

        service.send_admin_notification
      end

      it 'logs the report' do
        allow(service).to receive(:send_email_to_admin)

        expect(Rails.logger).to receive(:info).with(
          "New report ##{report.id} submitted: harassment - Comment"
        )

        service.send_admin_notification
      end
    end

    context 'when using SendGrid template' do
      before do
        ENV['SENDGRID_REPORT_NOTIFICATION_TEMPLATE'] = 'template-123'
      end

      after do
        ENV.delete('SENDGRID_REPORT_NOTIFICATION_TEMPLATE')
      end

      it 'uses template with dynamic data' do
        allow(service).to receive(:send_email) do |params|
          expect(params[:personalizations].first[:dynamic_template_data]).to include(
            admin_name: admin1.name,
            report_id: report.id,
            report_reason: "Harassment or bullying",
            report_description: "This is harassment",
            reporter_name: reporter.name,
            reportable_type: "Comment",
            reported_user_name: reported_user.name,
            reported_user_email: reported_user.email,
            is_overdue: false,
            subject: "🚨 New Content Report - 24hr Response Required"
          )

          expect(params[:template_id]).to eq('template-123')
        end

        service.send_admin_notification
      end
    end

    context 'when no SendGrid template configured' do
      before do
        ENV.delete('SENDGRID_REPORT_NOTIFICATION_TEMPLATE') if ENV['SENDGRID_REPORT_NOTIFICATION_TEMPLATE']
      end

      it 'sends basic HTML email' do
        allow(service).to receive(:send_email) do |params|
          expect(params[:content]).to be_present
          expect(params[:content].first[:type]).to eq('text/html')

          html = params[:content].first[:value]
          expect(html).to include('New Content Report Requires Review')
          expect(html).to include("Report ID:</strong> ##{report.id}")
          expect(html).to include(report.reporter.name)
        end

        service.send_admin_notification
      end

      it 'includes overdue warning for overdue reports' do
        allow(report).to receive(:overdue?).and_return(true)

        allow(service).to receive(:send_email) do |params|
          html = params[:content].first[:value]
          expect(html).to include('This report is OVERDUE for review!')
        end

        service.send_admin_notification
      end
    end

    context 'when email fails' do
      it 'logs error and continues' do
        allow(service).to receive(:send_email).and_raise(StandardError.new("Email failed"))

        expect(Rails.logger).to receive(:error).with(
          "Failed to send report notification to #{admin1.email}: Email failed"
        )
        expect(Rails.logger).to receive(:error).with(
          "Failed to send report notification to #{admin2.email}: Email failed"
        )

        expect { service.send_admin_notification }.not_to raise_error
      end
    end
  end

  describe 'private methods' do
    describe '#truncate_content' do
      it 'truncates long content' do
        long_content = "a" * 250
        result = service.send(:truncate_content, long_content)

        expect(result.length).to eq(203) # 200 chars + "..."
        expect(result).to end_with("...")
      end

      it 'does not truncate short content' do
        short_content = "Short content"
        result = service.send(:truncate_content, short_content)

        expect(result).to eq(short_content)
      end

      it 'returns N/A for blank content' do
        expect(service.send(:truncate_content, nil)).to eq("N/A")
        expect(service.send(:truncate_content, "")).to eq("N/A")
      end

      it 'accepts custom length' do
        content = "a" * 100
        result = service.send(:truncate_content, content, 50)

        expect(result.length).to eq(53) # 50 chars + "..."
      end
    end
  end
end
