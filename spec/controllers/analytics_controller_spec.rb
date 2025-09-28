require 'rails_helper'

RSpec.describe AnalyticsController, type: :controller do
  let(:user) { create(:user) }

  describe "POST #track" do
    context "without authentication" do
      it "tracks event without user" do
        post :track, params: { event: "Test Event", properties: { test: true } }
        expect(response).to have_http_status(:success)
        expect(JSON.parse(response.body)["status"]).to eq("success")
      end
    end

    context "with authentication" do
      before { allow(controller).to receive(:current_user).and_return(user) }

      it "tracks event with user context" do
        post :track, params: { event: "User Action", properties: { action: "click" } }
        expect(response).to have_http_status(:success)
        expect(JSON.parse(response.body)["status"]).to eq("success")
      end
    end
  end

  describe "POST #identify" do
    context "without authentication" do
      it "returns unauthorized" do
        post :identify
        expect(response).to have_http_status(:unauthorized)
        expect(JSON.parse(response.body)["status"]).to eq("error")
      end
    end

    context "with authentication" do
      before { allow(controller).to receive(:current_user).and_return(user) }

      it "identifies user successfully" do
        post :identify, params: { track_login: false }
        expect(response).to have_http_status(:success)
        expect(JSON.parse(response.body)["status"]).to eq("success")
      end

      it "identifies user and tracks login" do
        post :identify, params: { track_login: true }
        expect(response).to have_http_status(:success)
        expect(JSON.parse(response.body)["status"]).to eq("success")
      end
    end
  end

  describe "POST #page_view" do
    context "without authentication" do
      it "tracks page view without user" do
        post :page_view, params: { page: "Home", properties: {} }
        expect(response).to have_http_status(:success)
        expect(JSON.parse(response.body)["status"]).to eq("success")
      end
    end

    context "with authentication" do
      before { allow(controller).to receive(:current_user).and_return(user) }

      it "tracks page view with user context" do
        post :page_view, params: { page: "Dashboard", properties: { section: "main" } }
        expect(response).to have_http_status(:success)
        expect(JSON.parse(response.body)["status"]).to eq("success")
      end
    end
  end
end
