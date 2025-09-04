require 'rails_helper'

RSpec.describe "Reports", type: :request do
  let(:user) { create(:user) }
  let(:admin) { create(:user, admin: true) }
  let(:reporter) { create(:user) }
  let(:comment) { create(:comment, user: user) }
  let(:activity) { create(:activity, host: user) }
  
  let(:valid_headers) { { "Authorization" => "Bearer #{generate_token(reporter)}" } }
  let(:admin_headers) { { "Authorization" => "Bearer #{generate_token(admin)}" } }

  def generate_token(user)
    JWT.encode({ user_id: user.id }, ENV['JWT_SECRET'] || 'test_secret')
  end

  describe "GET /reports" do
    context "as admin" do
      before do
        create_list(:report, 3)
        create(:report, status: 'pending', created_at: 25.hours.ago) # overdue
      end

      it "returns list of reports" do
        get "/reports", headers: admin_headers
        
        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['reports'].length).to eq(4)
        expect(json['meta']).to include('total', 'page', 'per_page', 'overdue_count')
      end

      it "filters by status" do
        create(:report, status: 'resolved')
        
        get "/reports", params: { status: 'resolved' }, headers: admin_headers
        
        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['reports'].all? { |r| r['status'] == 'resolved' }).to be true
      end

      it "filters overdue reports" do
        get "/reports", params: { overdue: 'true' }, headers: admin_headers
        
        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['reports'].all? { |r| r['overdue'] == true }).to be true
      end
    end

    context "as non-admin" do
      it "returns forbidden" do
        get "/reports", headers: valid_headers
        
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "POST /reports" do
    let(:valid_params) do
      {
        report: {
          reportable_type: 'Comment',
          reportable_id: comment.id,
          reason: 'harassment',
          description: 'This comment is harassing'
        }
      }
    end

    context "with valid params" do
      it "creates a new report" do
        expect {
          post "/reports", params: valid_params, headers: valid_headers
        }.to change(Report, :count).by(1)
        
        expect(response).to have_http_status(:created)
        json = JSON.parse(response.body)
        expect(json['status']).to eq('success')
        expect(json['report_id']).to be_present
      end

      it "sends admin notification" do
        service = instance_double(ReportNotificationService)
        expect(ReportNotificationService).to receive(:new).and_return(service)
        expect(service).to receive(:send_admin_notification)
        
        post "/reports", params: valid_params, headers: valid_headers
      end
    end

    context "with invalid params" do
      it "returns error for missing reason" do
        invalid_params = {
          report: {
            reportable_type: 'Comment',
            reportable_id: comment.id
          }
        }
        
        post "/reports", params: invalid_params, headers: valid_headers
        
        expect(response).to have_http_status(:unprocessable_entity)
        json = JSON.parse(response.body)
        expect(json['status']).to eq('error')
        expect(json['errors']).to include("Reason can't be blank")
      end

      it "prevents duplicate reports from same user" do
        create(:report, reporter: reporter, reportable: comment)
        
        post "/reports", params: valid_params, headers: valid_headers
        
        expect(response).to have_http_status(:unprocessable_entity)
        json = JSON.parse(response.body)
        expect(json['errors']).to include("Reporter has already reported this content")
      end
    end

    context "without authentication" do
      it "returns unauthorized" do
        post "/reports", params: valid_params
        
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "GET /reports/:id" do
    let(:report) { create(:report) }

    context "as admin" do
      it "returns report details" do
        get "/reports/#{report.id}", headers: admin_headers
        
        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['id']).to eq(report.id)
        expect(json).to include('reportable_type', 'reason', 'status', 'reporter', 'reported_user')
      end
    end

    context "as non-admin" do
      it "returns forbidden" do
        get "/reports/#{report.id}", headers: valid_headers
        
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "PATCH /reports/:id/review" do
    let(:report) { create(:report, status: 'pending') }

    context "as admin" do
      it "marks report as under review" do
        patch "/reports/#{report.id}/review", headers: admin_headers
        
        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['status']).to eq('success')
        
        report.reload
        expect(report.status).to eq('reviewing')
        expect(report.reviewed_by).to eq(admin)
        expect(report.reviewed_at).to be_present
      end
    end

    context "as non-admin" do
      it "returns forbidden" do
        patch "/reports/#{report.id}/review", headers: valid_headers
        
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "PATCH /reports/:id/resolve" do
    let(:report) { create(:report, status: 'reviewing', reportable: comment) }

    context "as admin" do
      it "resolves report with content_deleted action" do
        params = {
          resolution_action: 'content_deleted',
          resolution_notes: 'Content violates terms'
        }
        
        patch "/reports/#{report.id}/resolve", params: params, headers: admin_headers
        
        expect(response).to have_http_status(:success)
        
        report.reload
        expect(report.status).to eq('resolved')
        expect(report.resolution_action).to eq('content_deleted')
        expect(report.resolution_notes).to eq('Content violates terms')
      end

      it "resolves report with user_warned action" do
        params = {
          resolution_action: 'user_warned',
          resolution_notes: 'First offense'
        }
        
        patch "/reports/#{report.id}/resolve", params: params, headers: admin_headers
        
        expect(response).to have_http_status(:success)
        
        report.reload
        expect(report.status).to eq('resolved')
        expect(report.resolution_action).to eq('user_warned')
      end

      it "resolves report with user_suspended action" do
        params = {
          resolution_action: 'user_suspended',
          resolution_notes: 'Multiple violations'
        }
        
        allow_any_instance_of(User).to receive(:suspend!)
        
        patch "/reports/#{report.id}/resolve", params: params, headers: admin_headers
        
        expect(response).to have_http_status(:success)
      end

      it "resolves report with user_banned action" do
        params = {
          resolution_action: 'user_banned',
          resolution_notes: 'Severe violation'
        }
        
        allow_any_instance_of(User).to receive(:ban!)
        
        patch "/reports/#{report.id}/resolve", params: params, headers: admin_headers
        
        expect(response).to have_http_status(:success)
      end
    end

    context "as non-admin" do
      it "returns forbidden" do
        patch "/reports/#{report.id}/resolve", headers: valid_headers
        
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "PATCH /reports/:id/dismiss" do
    let(:report) { create(:report, status: 'reviewing') }

    context "as admin" do
      it "dismisses the report" do
        params = { reason: 'Not a violation' }
        
        patch "/reports/#{report.id}/dismiss", params: params, headers: admin_headers
        
        expect(response).to have_http_status(:success)
        
        report.reload
        expect(report.status).to eq('dismissed')
        expect(report.resolution_action).to eq('dismissed')
        expect(report.resolution_notes).to eq('Not a violation')
      end
    end

    context "as non-admin" do
      it "returns forbidden" do
        patch "/reports/#{report.id}/dismiss", headers: valid_headers
        
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "GET /reports/stats" do
    before do
      create_list(:report, 2, status: 'pending')
      create(:report, status: 'pending', created_at: 25.hours.ago)
      create(:report, status: 'resolved', reviewed_at: 1.hour.ago)
      create(:report, status: 'dismissed')
    end

    context "as admin" do
      it "returns moderation statistics" do
        get "/reports/stats", headers: admin_headers
        
        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        
        expect(json['total_reports']).to eq(5)
        expect(json['pending_reports']).to eq(3)
        expect(json['overdue_reports']).to eq(1)
        expect(json['resolved_today']).to eq(1)
        expect(json).to include('reports_by_reason', 'reports_by_status', 'average_resolution_time')
      end
    end

    context "as non-admin" do
      it "returns forbidden" do
        get "/reports/stats", headers: valid_headers
        
        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end