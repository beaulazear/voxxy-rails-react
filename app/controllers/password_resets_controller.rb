class PasswordResetsController < ApplicationController
    skip_before_action :authorized

    def create
      Rails.logger.info "Params received: #{params.inspect}"
      user = User.find_by(email: password_reset_params[:email])
      if user
        user.generate_password_reset_token
        PasswordResetService.send_reset_email(user)
        render json: { message: "Password reset email sent." }, status: :ok
      else
        render json: { error: "Email not found." }, status: :not_found
      end
    end

    def update
        Rails.logger.info "🔑 Received Token: #{params[:token]}"
        Rails.logger.info "🔑 Received Password: #{params[:password]}"
    
        user = User.find_by(reset_password_token: params[:token])
    
        if user && user.password_reset_token_valid?
          if params[:password].present?
            if user.update(password: params[:password], password_confirmation: params[:password])
              Rails.logger.info "✅ Password reset successful for user #{user.email}"
              render json: { message: "Password successfully reset." }, status: :ok
            else
              Rails.logger.error "❌ Password reset failed: #{user.errors.full_messages.join(', ')}"
              render json: { error: user.errors.full_messages.join(", ") }, status: :unprocessable_entity
            end
          else
            Rails.logger.error "❌ Password is missing from the request."
            render json: { error: "Password cannot be blank." }, status: :unprocessable_entity
          end
        else
          Rails.logger.error "❌ Invalid or expired token."
          render json: { error: "Invalid or expired token." }, status: :unprocessable_entity
        end
      end

    private

    def password_reset_params
      params.require(:password_reset).permit(:email)
    end
end
