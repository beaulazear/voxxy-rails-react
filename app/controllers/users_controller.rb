# app/controllers/users_controller.rb
class UsersController < ApplicationController
  skip_before_action :authorized, only: [ :create, :verify, :verify_code, :resend_verification ]

  def update_push_token
    current_user.update!(
      push_token: params[:push_token],
      platform: params[:platform]
    )
    render json: { success: true }
  rescue => e
    render json: { error: e.message }, status: 422
  end

  def push_token_status
    render json: {
      user_id: current_user.id,
      has_push_token: current_user.push_token.present?,
      token_prefix: current_user.push_token&.first(10),
      push_notifications_enabled: current_user.push_notifications,
      can_receive_notifications: current_user.can_receive_push_notifications?,
      platform: current_user.platform,
      updated_at: current_user.updated_at
    }
  end

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
      Rails.logger.error "User creation failed: #{user.errors.full_messages.join(', ')}"
      Rails.logger.error "User params: #{user_params.inspect}"
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

  def pending_invitations
    unless current_user
      return render json: { error: "Not authorized" }, status: :unauthorized
    end

    # Make sure user can only check their own invitations
    unless current_user.id == params[:id].to_i
      return render json: { error: "Unauthorized" }, status: :unauthorized
    end

    # Get all pending invitations for this user
    pending_invitations = ActivityParticipant
      .includes(activity: :user)
      .where(
        invited_email: current_user.email,
        accepted: false,
        user_id: nil # Not yet accepted
      )
      .map do |participant|
        {
          id: participant.id,
          invited_at: participant.created_at,
          accepted: participant.accepted,
          activity: {
            id: participant.activity.id,
            activity_name: participant.activity.activity_name,
            activity_type: participant.activity.activity_type,
            description: participant.activity.description,
            activity_location: participant.activity.activity_location,
            date_notes: participant.activity.date_notes,
            welcome_message: participant.activity.welcome_message,
            user: {
              id: participant.activity.user.id,
              name: participant.activity.user.name,
              email: participant.activity.user.email
            }
          }
        }
      end

    render json: pending_invitations
  end

  def verify
    user = User.find_by(confirmation_code: params[:token])

    if user&.verify!
      NewUserEmailService.new_user_email_service(user)
      redirect_to "#{frontend_host}#/verification"
    else
      redirect_to "#{frontend_host}"
    end
  end

  def verify_code
    code = params[:code]&.strip

    if code.blank?
      return render json: { error: "Verification code is required" }, status: :bad_request
    end

    user = User.find_by(confirmation_code: code)

    if user.nil?
      return render json: { error: "Invalid verification code" }, status: :unprocessable_entity
    end

    unless user.confirmation_code_valid?
      return render json: { error: "Verification code has expired. Please request a new one." }, status: :unprocessable_entity
    end

    if user.verify!
      NewUserEmailService.new_user_email_service(user)
      render json: { message: "Email verified successfully!", user: UserSerializer.basic(user) }, status: :ok
    else
      render json: { error: "Failed to verify email" }, status: :unprocessable_entity
    end
  rescue StandardError => e
    Rails.logger.error "Verification error: #{e.message}"
    render json: { error: "An error occurred during verification" }, status: :internal_server_error
  end

  def resend_verification
    user = User.find_by(email: params[:email])

    if user
      if user.confirmed_at.nil?
        user.generate_new_confirmation_code!
        EmailVerificationService.send_verification_email(user)
        render json: { message: "Verification code has been resent." }, status: :ok
      else
        render json: { message: "Your email is already verified." }, status: :unprocessable_entity
      end
    else
      render json: { error: "User not found." }, status: :not_found
    end
  rescue StandardError => e
    Rails.logger.error "Resend verification error: #{e.message}"
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

  def accept_policies
    unless current_user
      return render json: { error: "Not authorized" }, status: :unauthorized
    end

    accepted_terms = params[:accept_terms] || params[:terms_accepted]
    accepted_privacy = params[:accept_privacy] || params[:privacy_accepted]
    accepted_guidelines = params[:accept_guidelines] || params[:community_guidelines_accepted]

    # Track what was accepted
    updates = {}

    if accepted_terms
      current_user.accept_terms!(params[:terms_version] || User::CURRENT_TERMS_VERSION)
      updates[:terms] = true
    end

    if accepted_privacy
      current_user.accept_privacy_policy!(params[:privacy_version] || User::CURRENT_PRIVACY_VERSION)
      updates[:privacy_policy] = true
    end

    if accepted_guidelines
      current_user.accept_community_guidelines!(params[:guidelines_version] || User::CURRENT_GUIDELINES_VERSION)
      updates[:community_guidelines] = true
    end

    if updates.any?
      render json: {
        message: "Policies accepted successfully",
        accepted: updates,
        user: {
          terms_accepted: current_user.has_accepted_terms?,
          privacy_policy_accepted: current_user.has_accepted_privacy_policy?,
          community_guidelines_accepted: current_user.has_accepted_community_guidelines?,
          all_policies_accepted: current_user.has_accepted_all_policies?
        }
      }, status: :ok
    else
      render json: { error: "No policies specified to accept" }, status: :bad_request
    end
  rescue => e
    Rails.logger.error "Policy acceptance error: #{e.message}"
    render json: { error: "Failed to accept policies" }, status: :internal_server_error
  end

  private

  def user_params
    params.require(:user).permit(
      :name, :email, :password, :password_confirmation, :avatar, :preferences,
      :text_notifications, :email_notifications, :push_notifications, :profile_pic,
      :neighborhood, :city, :state, :latitude, :longitude, :favorite_food, :bar_preferences, :role
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
