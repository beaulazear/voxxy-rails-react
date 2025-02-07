class UsersController < ApplicationController
  skip_before_action :authorized, only: [ :create, :verify, :resend_verification ]

  def create
    user = User.new(user_params)

    if user.save
      EmailVerificationService.send_verification_email(user)

      # Check if this user was invited to any activities
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
    user = User.includes(activities: [ :responses, :participants, :activity_participants ]).find_by(id: current_user.id)

    if user
      render json: user.as_json(
        include: {
          activities: {
            only: [ :id, :activity_name, :activity_type, :activity_location, :group_size, :date_notes, :created_at, :active, :emoji ],
            include: {
              responses: {
                only: [ :id, :notes, :created_at ]
              },
              participants: {
                only: [ :id, :name, :email ]
              },
              activity_participants: {
                only: [ :invited_email, :accepted ]
              }
            }
          }
        }
      )
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

  private

  def user_params
    params.require(:user).permit(:name, :username, :email, :password, :password_confirmation)
  end
end
