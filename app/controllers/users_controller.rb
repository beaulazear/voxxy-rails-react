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
        activity.comments.create!(
          user_id: user.id,
          content: "#{user.name} has joined the chat 🎉"
        )
      end

      if request.headers["X-Mobile-App"] == "true"
        token = JsonWebToken.encode(user_id: user.id)
        render json: user.as_json(only: [ :id, :name, :email, :avatar ]).merge(
          "token" => token,
          "profile_pic_url" => user.profile_pic_url
        ), status: :created
      else
        session[:user_id] = user.id
        render json: user.as_json.merge("profile_pic_url" => user.profile_pic_url), status: :created
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

      # Process user's activities with profile pics
      user_activities_with_pics = user.activities.map do |activity|
        activity.as_json(
          only: [ :id, :activity_name, :collecting, :voting, :finalized, :activity_type, :activity_location, :group_size, :date_notes, :created_at, :active, :emoji, :date_day, :date_time, :welcome_message, :completed ],
          include: {
            responses: { only: [ :id, :notes, :availability, :created_at, :user_id, :email, :activity_id ] },
            activity_participants: { only: [ :id, :user_id, :invited_email, :accepted, :created_at ] }
          }
        ).merge(
          "user" => activity.user.as_json(only: [ :id, :name, :email, :avatar, :created_at ]).merge("profile_pic_url" => activity.user.profile_pic_url),
          "participants" => activity.participants.map { |p| p.as_json(only: [ :id, :name, :email, :avatar, :created_at ]).merge("profile_pic_url" => p.profile_pic_url) },
          "comments" => activity.comments.map do |comment|
            comment.as_json.merge(
              "user" => comment.user.as_json(only: [ :id, :name, :avatar ]).merge("profile_pic_url" => comment.user.profile_pic_url)
            )
          end,
          "pinned_activities" => activity.pinned_activities.map do |pinned|
            pinned.as_json(
              only: [ :id, :title, :hours, :price_range, :address, :selected,
                      :description, :activity_id, :reviews, :photos, :reason, :website ],
              methods: [ :vote_count ]
            ).merge(
              "comments" => pinned.comments.map do |comment|
                comment.as_json(only: [ :id, :content, :created_at ]).merge(
                  "user" => comment.user.as_json(only: [ :id, :name, :email, :avatar ]).merge("profile_pic_url" => comment.user.profile_pic_url)
                )
              end,
              "voters" => pinned.voters.map { |voter| voter.as_json(only: [ :id, :name, :avatar ]).merge("profile_pic_url" => voter.profile_pic_url) },
              "votes" => pinned.votes.as_json(only: [ :id, :user_id ])
            )
          end
        )
      end

      # Process participant activities with profile pics
      participant_activities_with_pics = activity_participants.map do |ap|
        activity = ap.activity
        ap.as_json(only: [ :id, :accepted, :invited_email ]).merge(
          "activity" => activity.as_json(
            only: [ :id, :activity_name, :finalized, :collecting, :voting, :activity_type, :activity_location, :group_size, :date_notes, :created_at, :emoji, :date_day, :date_time, :welcome_message, :completed ],
            include: {
              responses: { only: [ :id, :notes, :availability, :email, :created_at, :user_id, :activity_id ] }
            }
          ).merge(
            "user" => activity.user.as_json(only: [ :id, :name, :email, :avatar, :created_at ]).merge("profile_pic_url" => activity.user.profile_pic_url),
            "participants" => activity.participants.map { |p| p.as_json(only: [ :id, :name, :email, :avatar, :created_at ]).merge("profile_pic_url" => p.profile_pic_url) },
            "comments" => activity.comments.map do |comment|
              comment.as_json.merge(
                "user" => comment.user.as_json(only: [ :id, :name, :avatar ]).merge("profile_pic_url" => comment.user.profile_pic_url)
              )
            end,
            "pinned_activities" => activity.pinned_activities.map do |pinned|
              pinned.as_json(
                only: [ :id, :title, :hours, :price_range, :address, :selected,
                        :description, :activity_id, :reviews, :photos, :reason, :website ],
                methods: [ :vote_count ]
              ).merge(
                "comments" => pinned.comments.map do |comment|
                  comment.as_json(only: [ :id, :content, :created_at ]).merge(
                    "user" => comment.user.as_json(only: [ :id, :name, :email, :avatar ]).merge("profile_pic_url" => comment.user.profile_pic_url)
                  )
                end,
                "voters" => pinned.voters.map { |voter| voter.as_json(only: [ :id, :name, :avatar ]).merge("profile_pic_url" => voter.profile_pic_url) },
                "votes" => pinned.votes.as_json(only: [ :id, :user_id ])
              )
            end
          )
        )
      end

      render json: user.as_json.merge(
        "profile_pic_url" => user.profile_pic_url,
        "activities" => user_activities_with_pics,
        "participant_activities" => participant_activities_with_pics
      )
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

      # Process user's activities with profile pics (same as show action)
      user_activities_with_pics = user.activities.map do |activity|
        activity.as_json(
          only: [ :id, :activity_name, :collecting, :voting, :finalized, :activity_type, :activity_location, :group_size, :date_notes, :created_at, :active, :emoji, :date_day, :date_time, :welcome_message, :completed ],
          include: {
            responses: { only: [ :id, :notes, :email, :availability, :created_at, :user_id, :activity_id ] },
            activity_participants: { only: [ :id, :user_id, :invited_email, :accepted ] }
          }
        ).merge(
          "user" => activity.user.as_json(only: [ :id, :name, :email, :avatar, :created_at ]).merge("profile_pic_url" => activity.user.profile_pic_url),
          "participants" => activity.participants.map { |p| p.as_json(only: [ :id, :name, :email, :avatar, :created_at ]).merge("profile_pic_url" => p.profile_pic_url) },
          "comments" => activity.comments.map do |comment|
            comment.as_json.merge(
              "user" => comment.user.as_json(only: [ :id, :name, :avatar ]).merge("profile_pic_url" => comment.user.profile_pic_url)
            )
          end,
          "pinned_activities" => activity.pinned_activities.map do |pinned|
            pinned.as_json(
              only: [ :id, :title, :hours, :price_range, :address, :selected,
                      :description, :activity_id, :reviews, :photos, :reason, :website ],
              methods: [ :vote_count ]
            ).merge(
              "comments" => pinned.comments.map do |comment|
                comment.as_json(only: [ :id, :content, :created_at ]).merge(
                  "user" => comment.user.as_json(only: [ :id, :name, :email, :avatar ]).merge("profile_pic_url" => comment.user.profile_pic_url)
                )
              end,
              "voters" => pinned.voters.map { |voter| voter.as_json(only: [ :id, :name, :avatar ]).merge("profile_pic_url" => voter.profile_pic_url) },
              "votes" => pinned.votes.as_json(only: [ :id, :user_id ])
            )
          end
        )
      end

      # Process participant activities with profile pics (same as show action)
      participant_activities_with_pics = activity_participants.map do |ap|
        activity = ap.activity
        ap.as_json(only: [ :id, :accepted, :invited_email ]).merge(
          "activity" => activity.as_json(
            only: [ :id, :activity_name, :collecting, :voting, :finalized, :activity_type, :activity_location, :group_size, :date_notes, :created_at, :emoji, :date_day, :date_time, :welcome_message, :completed ],
            include: {
              responses: { only: [ :id, :email, :notes, :availability, :created_at, :user_id, :activity_id ] }
            }
          ).merge(
            "user" => activity.user.as_json(only: [ :id, :name, :email, :avatar, :created_at ]).merge("profile_pic_url" => activity.user.profile_pic_url),
            "participants" => activity.participants.map { |p| p.as_json(only: [ :id, :name, :email, :avatar, :created_at ]).merge("profile_pic_url" => p.profile_pic_url) },
            "comments" => activity.comments.map do |comment|
              comment.as_json.merge(
                "user" => comment.user.as_json(only: [ :id, :name, :avatar ]).merge("profile_pic_url" => comment.user.profile_pic_url)
              )
            end,
            "pinned_activities" => activity.pinned_activities.map do |pinned|
              pinned.as_json(
                only: [ :id, :title, :hours, :price_range, :address, :selected,
                        :description, :activity_id, :reviews, :photos, :reason, :website ],
                methods: [ :vote_count ]
              ).merge(
                "comments" => pinned.comments.map do |comment|
                  comment.as_json(only: [ :id, :content, :created_at ]).merge(
                    "user" => comment.user.as_json(only: [ :id, :name, :email, :avatar ]).merge("profile_pic_url" => comment.user.profile_pic_url)
                  )
                end,
                "voters" => pinned.voters.map { |voter| voter.as_json(only: [ :id, :name, :avatar ]).merge("profile_pic_url" => voter.profile_pic_url) },
                "votes" => pinned.votes.as_json(only: [ :id, :user_id ])
              )
            end
          )
        )
      end

      render json: user.as_json.merge(
        "profile_pic_url" => user.profile_pic_url,
        "activities" => user_activities_with_pics,
        "participant_activities" => participant_activities_with_pics
      )
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
      :push_notifications,
      :profile_pic
    )
  end
end
