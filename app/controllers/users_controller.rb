# app/controllers/users_controller.rb
class UsersController < ApplicationController
  skip_before_action :authorized, only: [ :create, :verify, :resend_verification ]

  def create
    user = User.new(user_params)

    if user.save
      EmailVerificationService.send_verification_email(user)
      handle_pending_invites(user)

      if mobile_app_request?
        render_mobile_response(user)
      else
        render_web_response(user)
      end
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def show
    unless current_user
      return render json: { error: "Not authorized" }, status: :unauthorized
    end

    user = User.includes(
      activities: [
        :user, :participants, :activity_participants, :responses,
        { comments: :user },
        { pinned_activities: [ :votes, { comments: :user }, :voters ] }
      ]
    ).find_by(id: current_user.id)

    if user
      render json: UserSerializer.dashboard(user)
    else
      render json: { error: "Not authorized" }, status: :unauthorized
    end
  end

  def update
    if current_user.update(user_params)
      user = User.includes(
        activities: [
          :user, :participants, :activity_participants, :responses,
          { comments: :user },
          { pinned_activities: [ :votes, { comments: :user }, :voters ] }
        ]
      ).find(current_user.id)

      render json: UserSerializer.dashboard(user)
    else
      render json: { errors: current_user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def verify
    user = User.find_by(confirmation_token: params[:token])

    if user&.verify!
      NewUserEmailService.new_user_email_service(user)
      redirect_to "#{frontend_host}#/verification"
    else
      redirect_to "#{frontend_host}"
    end
  end

  def resend_verification
    user = User.find_by(email: params[:email])

    if user
      if user.confirmed_at.nil?
        if user.update_columns(confirmation_token: SecureRandom.hex(10))
          EmailVerificationService.send_verification_email(user)
          render json: { message: "Verification email has been resent." }, status: :ok
        else
          render json: { error: "Failed to generate a new verification token." }, status: :unprocessable_entity
        end
      else
        render json: { message: "Your email is already verified." }, status: :unprocessable_entity
      end
    else
      render json: { error: "User not found." }, status: :not_found
    end
  rescue StandardError => e
    render json: { error: "An error occurred: #{e.message}" }, status: :internal_server_error
  end

  def invite_signup_redirect
    invited_email = params[:invited_email]
    activity_id = params[:activity_id]

    if invited_email.present? && activity_id.present?
      redirect_to "#{frontend_host}#/signup?invited_email=#{invited_email}&activity_id=#{activity_id}"
    else
      redirect_to "#{frontend_host}"
    end
  end

  def destroy
    if current_user&.destroy
      render json: { message: "User account successfully deleted" }, status: :ok
    else
      render json: { error: "Failed to delete account" }, status: :unprocessable_entity
    end
  end

  private

  def user_params
    params.require(:user).permit(
      :name, :email, :password, :password_confirmation, :avatar, :preferences,
      :text_notifications, :email_notifications, :push_notifications, :profile_pic
    )
  end

  def handle_pending_invites(user)
    pending_invites = ActivityParticipant.where(invited_email: user.email, accepted: false)
    pending_invites.find_each do |invite|
      invite.update!(user: user, accepted: true)
      invite.activity.comments.create!(
        user_id: user.id,
        content: "#{user.name} has joined the chat 🎉"
      )
    end
  end

  def mobile_app_request?
    request.headers["X-Mobile-App"] == "true"
  end

  def render_mobile_response(user)
    token = JsonWebToken.encode(user_id: user.id)
    render json: UserSerializer.basic(user).merge(token: token), status: :created
  end

  def render_web_response(user)
    session[:user_id] = user.id
    render json: UserSerializer.full(user), status: :created
  end
end
