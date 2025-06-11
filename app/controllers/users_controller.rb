class UsersController < ApplicationController
  skip_before_action :authorized, only: [ :create, :verify, :resend_verification ]

  def create
    user = User.new(user_params)

    if user.save
      EmailVerificationService.send_verification_email(user)

      pending_invites = ActivityParticipant.where(invited_email: user.email, accepted: false)
      pending_invites.find_each do |invite|
        invite.update!(user: user, accepted: true)
        activity = invite.activity
        activity.update!(group_size: activity.group_size + 1)
        activity.comments.create!(
          user_id: user.id,
          content: "#{user.name} has joined the chat 🎉"
        )
      end

      if request.headers["X-Mobile-App"] == "true"
        token = JsonWebToken.encode(user_id: user.id)
        render json: user.as_json(only: [ :id, :name, :email, :avatar ]).merge("token" => token),
               status: :created
      else
        session[:user_id] = user.id
        render json: user, status: :created
      end

    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def show
    unless current_user
      return render json: { error: "Not authorized" }, status: :unauthorized
    end

    user = User.includes(activities: [ :responses, :participants, :activity_participants ]).find_by(id: current_user.id)

    if user
      activity_participants = ActivityParticipant.includes(:activity).where("user_id = ? OR invited_email = ?", user.id, user.email)

      participant_activities = activity_participants.map(&:activity).uniq

      render json: user.as_json(
        include: {
          activities: {
            only: [ :id, :activity_name, :collecting, :voting, :finalized, :activity_type, :activity_location, :group_size, :date_notes, :created_at, :active, :emoji, :date_day, :date_time, :welcome_message, :completed ],
            include: {
              user: { only: [ :id, :name, :email, :avatar, :created_at ] },
              responses: { only: [ :id, :notes, :availability, :created_at, :user_id, :activity_id ] },
              participants: { only: [ :id, :name, :email, :avatar, :created_at ] },
              activity_participants: { only: [ :id, :user_id, :invited_email, :accepted, :created_at ] },
              comments: { include: { user: { only: [ :id, :name, :avatar ] } } },
              pinned_activities: {
              only: [ :id, :title, :hours, :price_range, :address, :selected,
                      :description, :activity_id, :reviews, :photos, :reason, :website ],
              methods: [ :vote_count ],
              include: {
                comments: {
                  only: [ :id, :content, :created_at ],
                  include: { user: { only: [ :id, :name, :email, :avatar ] } }
                },
                voters: { only: [ :id, :name, :avatar ] },
                votes: { only: [ :id, :user_id ] }
              }
            }
            }
          }
        }
      ).merge("participant_activities" => activity_participants.as_json(
        only: [ :id, :accepted, :invited_email ],
        include: {
          activity: {
            only: [ :id, :activity_name, :finalized, :collecting, :voting, :activity_type, :activity_location, :group_size, :date_notes, :created_at, :emoji, :date_day, :date_time, :welcome_message, :completed ],
            include: {
              user: { only: [ :id, :name, :email, :avatar, :created_at ] },
              responses: { only: [ :id, :notes, :availability, :created_at, :user_id, :activity_id ] },
              participants: { only: [ :id, :name, :email, :avatar, :created_at ] },
              comments: { include: { user: { only: [ :id, :name, :avatar ] } } },
              pinned_activities: {
              only: [ :id, :title, :hours, :price_range, :address, :selected,
                      :description, :activity_id, :reviews, :photos, :reason, :website ],
              methods: [ :vote_count ],
              include: {
                comments: {
                  only: [ :id, :content, :created_at ],
                  include: { user: { only: [ :id, :name, :email, :avatar ] } }
                },
                voters: { only: [ :id, :name, :avatar ] },
                votes: { only: [ :id, :user_id ] }
              }
              }
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

  def update
    user = current_user
    if user.update(user_params)
      activity_participants = ActivityParticipant.includes(:activity).where("user_id = ? OR invited_email = ?", user.id, user.email)

      participant_activities = activity_participants.map(&:activity).uniq
      render json: user.as_json(
        include: {
          activities: {
            only: [ :id, :activity_name, :collecting, :voting, :finalized, :activity_type, :activity_location, :group_size, :date_notes, :created_at, :active, :emoji, :date_day, :date_time, :welcome_message, :completed ],
            include: {
              user: { only: [ :id, :name, :email, :avatar, :created_at ] },
              responses: { only: [ :id, :notes, :availability, :created_at, :user_id, :activity_id ] },
              participants: { only: [ :id, :name, :email, :avatar, :created_at ] },
              activity_participants: { only: [ :id, :user_id, :invited_email, :accepted ] },
              comments: { include: { user: { only: [ :id, :name, :avatar ] } } },
              pinned_activities: {
              only: [ :id, :title, :hours, :price_range, :address, :selected,
                      :description, :activity_id, :reviews, :photos, :reason, :website ],
              methods: [ :vote_count ],
              include: {
                comments: {
                  only: [ :id, :content, :created_at ],
                  include: { user: { only: [ :id, :name, :email, :avatar ] } }
                },
                voters: { only: [ :id, :name, :avatar ] },
                votes: { only: [ :id, :user_id ] }
              }
            }
            }
          }
        }
      ).merge("participant_activities" => activity_participants.as_json(
        only: [ :id, :accepted, :invited_email ],
        include: {
          activity: {
            only: [ :id, :activity_name, :collecting, :voting, :finalized, :activity_type, :activity_location, :group_size, :date_notes, :created_at, :emoji, :date_day, :date_time, :welcome_message, :completed ],
            include: {
              user: { only: [ :id, :name, :email, :avatar, :created_at ] },
              responses: { only: [ :id, :notes, :availability, :created_at, :user_id, :activity_id ] },
              participants: { only: [ :id, :name, :email, :avatar, :created_at ] },
              comments: { include: { user: { only: [ :id, :name, :avatar ] } } },
              pinned_activities: {
              only: [ :id, :title, :hours, :price_range, :address, :selected,
                      :description, :activity_id, :reviews, :photos, :reason, :website ],
              methods: [ :vote_count ],
              include: {
                comments: {
                  only: [ :id, :content, :created_at ],
                  include: { user: { only: [ :id, :name, :email, :avatar ] } }
                },
                voters: { only: [ :id, :name, :avatar ] },
                votes: { only: [ :id, :user_id ] }
              }
              }
            }
          }
        }
      ))
    else
      render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    user = current_user

    if user
      if user.destroy
        render json: { message: "User account successfully deleted" }, status: :ok
      else
        render json: { error: "Failed to delete account" }, status: :unprocessable_entity
      end
    else
      render json: { error: "User not found" }, status: :not_found
    end
  end

  # def make_admin
  #   if current_user.update(admin: true)
  #     render json: { message: "You are now an admin.", user: current_user }, status: :ok
  #   else
  #     render json: { error: "Failed to update admin status." }, status: :unprocessable_entity
  #   end
  # end

  private

  def user_params
    params.require(:user).permit(
      :name,
      :email,
      :password,
      :password_confirmation,
      :avatar,
      :preferences,
      :text_notifications,
      :email_notifications,
      :push_notifications
    )
  end
end
