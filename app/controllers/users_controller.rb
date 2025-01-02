class UsersController < ApplicationController
  skip_before_action :authorized, only: [ :create, :verify, :index, :resend_verification ]

  def create
    user = User.new(user_params)
    if user.save
      EmailVerificationService.send_verification_email(user)
      render json: {
        id: user.id,
        name: user.name,
        username: user.username,
        email: user.email,
        confirmed_at: user.confirmed_at
      }, status: :created
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def show
    user = @current_user
    if user
        render json: user
    else
        render json: { error: "Not authorized" }, status: :unauthorized
    end
  end

  def index
    users = User.all
    if users
      render json: users
    else
      render json: "not found"
    end
  end

  def verify
    user = User.find_by(confirmation_token: params[:token])

    if user&.verify!
      # Redirect to React frontend with token as a query parameter
      redirect_to "#{frontend_host}#/verification"
    else
      redirect_to "#{frontend_host}"
    end
  end

  def resend_verification
    Rails.logger.info "Resend Verification Params: #{params.inspect}"

    user = User.find_by(email: params[:email])
    Rails.logger.info "Found User: #{user.inspect}" if user

    if user
      if user.confirmed_at.nil?
        if user.update_columns(confirmation_token: SecureRandom.hex(10))
          Rails.logger.info "New confirmation token: #{user.confirmation_token}"
          EmailVerificationService.send_verification_email(user)
          render json: { message: "Verification email has been resent." }, status: :ok
        else
          Rails.logger.error "Failed to update confirmation token for user #{user.email}"
          render json: { error: "Failed to generate a new verification token." }, status: :unprocessable_entity
        end
      else
        render json: { message: "Your email is already verified." }, status: :unprocessable_entity
      end
    else
      Rails.logger.error "User not found with email: #{params[:email]}"
      render json: { error: "User not found." }, status: :not_found
    end
  rescue StandardError => e
    Rails.logger.error "Error in resend_verification: #{e.message}"
    render json: { error: "An error occurred: #{e.message}" }, status: :internal_server_error
  end

  private

  def user_params
    params.require(:user).permit(:name, :username, :email, :password, :password_confirmation)
  end
end
