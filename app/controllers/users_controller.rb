class UsersController < ApplicationController
  skip_before_action :authorized, only: [ :create, :verify, :resend_verification ]

  def create
    user = User.new(user_params)

    if user.save
      EmailVerificationService.send_verification_email(user)

      pending_invites = ActivityParticipant.where(invited_email: user.email, accepted: false)

      pending_invites.each do |invite|
        invite.update(user: user, accepted: true)
      end

      render json: user, status: :created
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def show
    unless current_user
      return render json: { error: "Not authorized" }, status: :unauthorized
    end

    # ✅ Fetch the user including their owned activities
    user = User.includes(activities: [ :responses, :participants, :activity_participants ]).find_by(id: current_user.id)

    if user
      # ✅ Fetch activity participants where user is invited OR has accepted
      activity_participants = ActivityParticipant.includes(:activity).where("user_id = ? OR invited_email = ?", user.id, user.email)

      # ✅ Extract the activities from the activity_participants
      participant_activities = activity_participants.map(&:activity).uniq

      render json: user.as_json(
        include: {
          activities: { # ✅ Activities the user owns
            only: [ :id, :activity_name, :activity_type, :activity_location, :group_size, :date_notes, :created_at, :active, :emoji ],
            include: {
              user: { only: [ :id, :name, :email ] },
              responses: { only: [ :id, :notes, :created_at ] },
              participants: { only: [ :id, :name, :email ] },
              activity_participants: { only: [ :id, :user_id, :invited_email, :accepted ] }
            }
          }
        }
      ).merge("participant_activities" => activity_participants.as_json(
        only: [ :id, :accepted, :invited_email ],
        include: {
          activity: {
            only: [ :id, :activity_name, :activity_type, :activity_location, :group_size, :date_notes, :created_at, :emoji ],
            include: {
              user: { only: [ :id, :name, :email ] }, # ✅ Includes host details
              participants: { only: [ :id, :name, :email ] }
            }
          }
        }
      ))
    else
      render json: { error: "Not authorized" }, status: :unauthorized
    end
  end

  def verify
    user = User.find_by(confirmation_token: params[:token])

    if user&.verify!
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

  def index
    users = User.all
    render json: users
  end

  private

  def user_params
    params.require(:user).permit(:name, :username, :email, :password, :password_confirmation)
  end
end
