require 'rails_helper'

RSpec.describe "Authentication", type: :request do
  describe "POST /users (Sign up)" do
    context "with valid parameters" do
      let(:valid_params) do
        {
          user: {
            name: "Test User",
            email: "test@example.com",
            password: "password123",
            password_confirmation: "password123"
          }
        }
      end
      
      it "creates a new user" do
        expect {
          post "/users", params: valid_params
        }.to change(User, :count).by(1)
      end
      
      it "returns success status" do
        post "/users", params: valid_params
        expect(response).to have_http_status(:created)
      end
      
      it "returns user data without password" do
        post "/users", params: valid_params
        json = JSON.parse(response.body)
        expect(json["name"]).to eq("Test User")
        expect(json["email"]).to eq("test@example.com")
        expect(json).not_to have_key("password")
        expect(json).not_to have_key("password_digest")
      end
      
      it "creates an unconfirmed user" do
        post "/users", params: valid_params
        user = User.last
        expect(user.confirmed_at).to be_nil
        expect(user.confirmation_token).to be_present
      end
    end
    
    context "with invalid parameters" do
      it "fails with missing name" do
        post "/users", params: { user: { email: "test@example.com", password: "password123" } }
        expect(response).to have_http_status(:unprocessable_entity)
        expect(JSON.parse(response.body)["errors"]).to include("Name can't be blank")
      end
      
      it "fails with invalid email" do
        post "/users", params: { 
          user: {
            name: "Test", 
            email: "invalid-email",
            password: "password123",
            password_confirmation: "password123"
          }
        }
        expect(response).to have_http_status(:unprocessable_entity)
        expect(JSON.parse(response.body)["errors"]).to include("Email is invalid")
      end
      
      it "fails with duplicate email" do
        create(:user, email: "taken@example.com")
        post "/users", params: {
          user: {
            name: "Test",
            email: "taken@example.com",
            password: "password123",
            password_confirmation: "password123"
          }
        }
        expect(response).to have_http_status(:unprocessable_entity)
        expect(JSON.parse(response.body)["errors"]).to include("Email has already been taken")
      end
      
      it "fails with password mismatch" do
        post "/users", params: {
          user: {
            name: "Test",
            email: "test@example.com",
            password: "password123",
            password_confirmation: "different"
          }
        }
        expect(response).to have_http_status(:unprocessable_entity)
        expect(JSON.parse(response.body)["errors"]).to include("Password confirmation doesn't match Password")
      end
    end
  end
  
  describe "POST /login" do
    let!(:user) { create(:user, email: "test@example.com", password: "password123") }
    
    context "with valid credentials" do
      it "returns success status" do
        post "/login", params: { email: "test@example.com", password: "password123" }
        expect(response).to have_http_status(:ok)
      end
      
      it "returns user data" do
        post "/login", params: { email: "test@example.com", password: "password123" }
        json = JSON.parse(response.body)
        expect(json["email"]).to eq("test@example.com")
        expect(json["token"]).to be_nil # Web requests don't get tokens
      end
      
      it "returns token for mobile requests" do
        post "/login", 
             params: { email: "test@example.com", password: "password123" },
             headers: { "X-Mobile-App" => "true" }
        json = JSON.parse(response.body)
        expect(json["email"]).to eq("test@example.com")
        expect(json["token"]).to be_present
      end
      
      it "sets session cookie" do
        post "/login", params: { email: "test@example.com", password: "password123" }
        expect(session[:user_id]).to eq(user.id)
      end
    end
    
    context "with invalid credentials" do
      it "fails with wrong password" do
        post "/login", params: { email: "test@example.com", password: "wrongpassword" }
        expect(response).to have_http_status(:unauthorized)
        expect(JSON.parse(response.body)["error"]).to eq("Invalid email or password")
      end
      
      it "fails with non-existent email" do
        post "/login", params: { email: "nonexistent@example.com", password: "password123" }
        expect(response).to have_http_status(:unauthorized)
        expect(JSON.parse(response.body)["error"]).to eq("Invalid email or password")
      end
    end
  end
  
  describe "DELETE /logout" do
    let(:user) { create(:user) }
    
    before do
      post "/login", params: { email: user.email, password: "password123" }
    end
    
    it "clears the session" do
      expect(session[:user_id]).to eq(user.id)
      
      delete "/logout"
      
      expect(response).to have_http_status(:no_content)
      expect(session[:user_id]).to be_nil
    end
  end
  
  describe "GET /me" do
    let(:user) { create(:user) }
    
    context "when authenticated" do
      before do
        post "/login", params: { email: user.email, password: "password123" }
      end
      
      it "returns current user data" do
        get "/me"
        expect(response).to have_http_status(:ok)
        json = JSON.parse(response.body)
        expect(json["id"]).to eq(user.id)
        expect(json["email"]).to eq(user.email)
      end
    end
    
    context "when not authenticated" do
      it "returns unauthorized" do
        get "/me"
        expect(response).to have_http_status(:unauthorized)
      end
    end
    
    context "with JWT token" do
      it "authenticates with valid token" do
        # Login with mobile flag to get a token
        post "/login", 
             params: { email: user.email, password: "password123" },
             headers: { "X-Mobile-App" => "true" }
        token = JSON.parse(response.body)["token"]
        
        get "/me", headers: { "Authorization" => "Bearer #{token}" }
        expect(response).to have_http_status(:ok)
      end
      
      it "fails with invalid token" do
        get "/me", headers: { "Authorization" => "Bearer invalidtoken" }
        expect(response).to have_http_status(:unauthorized)
      end
    end
  end
end