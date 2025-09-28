# Development-only controller for testing
# This controller should NEVER be enabled in production

class DevelopmentController < ApplicationController
  before_action :ensure_development_environment
  before_action :authenticate_user

  # Reset policy acceptance for testing onboarding flow
  # DELETE /development/reset_policies
  def reset_policies
    if current_user
      current_user.update_columns(
        terms_accepted_at: nil,
        terms_version: nil,
        privacy_accepted_at: nil,
        privacy_version: nil,
        guidelines_accepted_at: nil,
        guidelines_version: nil
      )

      render json: {
        message: "Policies reset successfully for user #{current_user.email}",
        user: {
          all_policies_accepted: current_user.has_accepted_all_policies?,
          terms_accepted: current_user.has_accepted_terms?,
          privacy_policy_accepted: current_user.has_accepted_privacy_policy?,
          community_guidelines_accepted: current_user.has_accepted_community_guidelines?
        }
      }, status: :ok
    else
      render json: { error: "User not found" }, status: :not_found
    end
  end

  private

  def ensure_development_environment
    unless Rails.env.development?
      render json: { error: "This endpoint is only available in development" }, status: :forbidden
    end
  end
end
