# app/controllers/application_controller.rb
class ApplicationController < ActionController::API
  private

  def json_request?
    request.format.json?
  end
end