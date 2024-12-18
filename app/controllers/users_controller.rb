class UsersController < ApplicationController
  skip_before_action :authorized, only: [ :create, :verify, :index, :resend_verification ]

  def create
    user = User.new(user_params)
    if user.save
      EmailVerificationService.send_verification_email(user)
      render json: { message: "User created. Please check your email to verify your account." }, status: :created
    else
      render json: { errors: user.errors.to_hash(true) }, status: :unprocessable_entity
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
    user = User.find_by(email: params[:email])

    if user
      if user.confirmed_at.nil?
        user.update(confirmation_token: SecureRandom.hex(10)) # Generate a new token
        EmailVerificationService.send_verification_email(user)
        render json: { message: "Verification email has been resent." }, status: :ok
      else
        render json: { message: "Your email is already verified." }, status: :unprocessable_entity
      end
    else
      render json: { error: "User not found." }, status: :not_found
    end
  rescue StandardError => e
    render json: { error: "An error occurred: #{e.message}" }, status: :internal_server_error
  end

  private

  def user_params
    params.require(:user).permit(:name, :username, :email, :password)
  end
end
