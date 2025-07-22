module AuthHelper
  def login_user(user)
    post '/login', params: { email: user.email, password: 'password123' }
    @auth_token = JSON.parse(response.body)['token'] if response.successful?
  end

  def auth_headers
    { 'Authorization': "Bearer #{@auth_token}" } if @auth_token
  end

  def create_and_login_user(attributes = {})
    user = create(:user, attributes)
    login_user(user)
    user
  end
end

RSpec.configure do |config|
  config.include AuthHelper, type: :request
end
