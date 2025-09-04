require 'rails_helper'

RSpec.describe "Admin::Moderation", type: :request do
  let(:admin) { create(:user, admin: true) }
  let(:non_admin) { create(:user) }
  let(:user) { create(:user) }
  
  let(:admin_headers) { { "Authorization" => "Bearer #{generate_token(admin)}" } }
  let(:non_admin_headers) { { "Authorization" => "Bearer #{generate_token(non_admin)}" } }

  def generate_token(user)
    JWT.encode({ user_id: user.id }, ENV['JWT_SECRET'] || 'test_secret')
  end

  describe "GET /admin/reports" do
    before do
      create_list(:report, 3)
      create(:report, status: 'pending', created_at: 25.hours.ago) # overdue
      create(:report, status: 'resolved', reviewed_at: 1.hour.ago)
    end

    context "as admin" do
      it "returns dashboard with stats and recent reports" do
        get "/admin/reports", headers: admin_headers
        
        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        
        expect(json['stats']).to include(
          'total_reports',
          'pending_reports',
          'overdue_reports',
          'resolved_today',
          'average_resolution_time'
        )
        expect(json['recent_reports']).to be_an(Array)
        expect(json['overdue_reports']).to be_an(Array)
        expect(json['reports_by_reason']).to be_a(Hash)
        expect(json['reports_by_status']).to be_a(Hash)
      end
    end

    context "as non-admin" do
      it "returns forbidden" do
        get "/admin/reports", headers: non_admin_headers
        
        expect(response).to have_http_status(:forbidden)
      end
    end

    context "without authentication" do
      it "returns unauthorized" do
        get "/admin/reports"
        
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe "GET /admin/moderation_actions" do
    before do
      create_list(:moderation_action, 5)
    end

    context "as admin" do
      it "returns list of moderation actions with pagination" do
        get "/admin/moderation_actions", headers: admin_headers
        
        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        
        expect(json['actions']).to be_an(Array)
        expect(json['meta']).to include('total', 'page', 'per_page', 'total_pages')
      end

      it "paginates results" do
        get "/admin/moderation_actions", params: { page: 2 }, headers: admin_headers
        
        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['meta']['page']).to eq(2)
      end
    end

    context "as non-admin" do
      it "returns forbidden" do
        get "/admin/moderation_actions", headers: non_admin_headers
        
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "GET /admin/users/:id/moderation_history" do
    let(:target_user) { create(:user) }
    
    before do
      create_list(:report, 2, reporter: target_user)
      create(:comment, user: target_user)
      create(:report, reportable: target_user.comments.first)
      create_list(:moderation_action, 3, user: target_user)
    end

    context "as admin" do
      it "returns user's moderation history" do
        get "/admin/users/#{target_user.id}/moderation_history", headers: admin_headers
        
        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        
        expect(json['user']).to include('id', 'name', 'email', 'status')
        expect(json['reports_filed_by']).to eq(2)
        expect(json['reports_against']).to be >= 0
        expect(json['moderation_actions']).to be_an(Array)
        expect(json).to include('warnings_count', 'status', 'suspended_until', 'banned_at')
      end
    end

    context "as non-admin" do
      it "returns forbidden" do
        get "/admin/users/#{target_user.id}/moderation_history", headers: non_admin_headers
        
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "POST /admin/users/:id/suspend" do
    context "as admin" do
      it "suspends user for specified duration" do
        params = { duration: 7, reason: "Test suspension" }
        
        post "/admin/users/#{user.id}/suspend", params: params, headers: admin_headers
        
        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['status']).to eq('success')
        expect(json['message']).to include('User suspended until')
        
        user.reload
        expect(user.status).to eq('suspended')
        expect(user.suspended_until).to be_present
        expect(user.suspension_reason).to eq('Test suspension')
      end

      it "creates moderation action" do
        params = { duration: 7, reason: "Test suspension" }
        
        expect {
          post "/admin/users/#{user.id}/suspend", params: params, headers: admin_headers
        }.to change(ModerationAction, :count).by(1)
        
        action = ModerationAction.last
        expect(action.action_type).to eq('suspended')
        expect(action.user).to eq(user)
        expect(action.moderator).to eq(admin)
      end
    end

    context "as non-admin" do
      it "returns forbidden" do
        post "/admin/users/#{user.id}/suspend", headers: non_admin_headers
        
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "POST /admin/users/:id/unsuspend" do
    before do
      user.update(status: 'suspended', suspended_until: 7.days.from_now, suspension_reason: 'Test')
    end

    context "as admin" do
      it "removes user suspension" do
        post "/admin/users/#{user.id}/unsuspend", headers: admin_headers
        
        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['status']).to eq('success')
        expect(json['message']).to eq('User suspension lifted')
        
        user.reload
        expect(user.status).to eq('active')
        expect(user.suspended_until).to be_nil
      end

      it "creates moderation action" do
        expect {
          post "/admin/users/#{user.id}/unsuspend", headers: admin_headers
        }.to change(ModerationAction, :count).by(1)
        
        action = ModerationAction.last
        expect(action.action_type).to eq('unbanned')
      end
    end

    context "as non-admin" do
      it "returns forbidden" do
        post "/admin/users/#{user.id}/unsuspend", headers: non_admin_headers
        
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "POST /admin/users/:id/ban" do
    context "as admin" do
      it "permanently bans user" do
        params = { reason: "Severe violation" }
        
        post "/admin/users/#{user.id}/ban", params: params, headers: admin_headers
        
        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['status']).to eq('success')
        expect(json['message']).to eq('User permanently banned')
        
        user.reload
        expect(user.status).to eq('banned')
        expect(user.banned_at).to be_present
        expect(user.ban_reason).to eq('Severe violation')
      end

      it "creates moderation action" do
        params = { reason: "Severe violation" }
        
        expect {
          post "/admin/users/#{user.id}/ban", params: params, headers: admin_headers
        }.to change(ModerationAction, :count).by(1)
        
        action = ModerationAction.last
        expect(action.action_type).to eq('banned')
        expect(action.reason).to eq('Severe violation')
      end
    end

    context "as non-admin" do
      it "returns forbidden" do
        post "/admin/users/#{user.id}/ban", headers: non_admin_headers
        
        expect(response).to have_http_status(:forbidden)
      end
    end
  end

  describe "POST /admin/users/:id/unban" do
    before do
      user.update(status: 'banned', banned_at: Time.current, ban_reason: 'Test')
    end

    context "as admin" do
      it "removes user ban" do
        post "/admin/users/#{user.id}/unban", headers: admin_headers
        
        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['status']).to eq('success')
        expect(json['message']).to eq('User ban lifted')
        
        user.reload
        expect(user.status).to eq('active')
        expect(user.banned_at).to be_nil
      end

      it "creates moderation action" do
        expect {
          post "/admin/users/#{user.id}/unban", headers: admin_headers
        }.to change(ModerationAction, :count).by(1)
        
        action = ModerationAction.last
        expect(action.action_type).to eq('unbanned')
      end
    end

    context "as non-admin" do
      it "returns forbidden" do
        post "/admin/users/#{user.id}/unban", headers: non_admin_headers
        
        expect(response).to have_http_status(:forbidden)
      end
    end
  end
end