class ActivitiesController < HtmlController
  skip_before_action :verify_authenticity_token,
  if: -> { request.format.json? && !action_name.eql?("share") }
  skip_before_action :authorized, only: [ :share ]

  protect_from_forgery with: :exception, only: [ :share ]

  protect_from_forgery with: :null_session,
  if: -> { request.format.json? }

  before_action :authorized

    def create
      activity = current_user.activities.build(activity_params.except(:participants))
      if activity.save
        invite_emails = activity_params[:participants] || []
        invite_emails.each { |email| invite_participant(email, activity) }
        render json: activity.as_json(
          only: [ :id, :activity_name, :activity_type, :activity_location, :group_size, :date_notes, :created_at, :emoji, :date_day, :date_time, :welcome_message, :finalized ],
          include: {
            user: { only: [ :id, :name, :email, :avatar ] },
            activity_participants: { only: [ :id, :user_id, :invited_email, :accepted ] },
            participants: { only: [ :id, :name, :email, :avatar ] }
          }
        ), status: :created
      else
        render json: { errors: activity.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def update
      activity = current_user.activities.find(params[:id])

      Activity.transaction do
        if activity_params.key?(:finalized)
          activity.finalized = activity_params[:finalized]
        end

        if activity_params.key?(:selected_pinned_id)
          new_id = activity_params[:selected_pinned_id].to_i

          activity.pinned_activities.where(selected: true).update_all(selected: false)
          activity.pinned_activities.find(new_id).update!(selected: true)
        end

        activity.update!(activity_params.except(:finalized, :selected_pinned_id))
      end

      render json: activity.to_json(include: [ :participants, :activity_participants, :responses ]), status: :ok

    rescue ActiveRecord::RecordInvalid => invalid
      Rails.logger.error "❌ Activity update failed: #{invalid.record.errors.full_messages}"
      render json: { errors: invalid.record.errors.full_messages }, status: :unprocessable_entity
    end

    def destroy
      activity = current_user.activities.find_by(id: params[:id])
      if activity
        activity.destroy
        render json: { message: "Activity deleted" }, status: :ok
      else
        render json: { message: "Not Found" }, status: :not_found
      end
    end

    def index
      activities = current_user.activities.includes(:user, :responses, :activity_participants, :participants)

      render json: activities.as_json(
        only: [ :id, :activity_name, :activity_type, :finalized, :activity_location, :group_size, :date_notes, :created_at, :active, :emoji, :user_id, :date_day, :date_time, :welcome_message, :completed ],
        include: {
          user: { only: [ :id, :name, :email ] },
          responses: { only: [ :id, :notes, :created_at, :user_id, :activity_id ] },
          activity_participants: { only: [ :id, :user_id, :invited_email, :accepted ] },
          participants: { only: [ :id, :name, :email, :avatar ] }
        }
      )
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
              only: [ :id, :activity_name, :finalized, :activity_type, :activity_location, :group_size, :date_notes, :created_at, :active, :emoji, :date_day, :date_time, :welcome_message, :completed ],
              include: {
                user: { only: [ :id, :name, :email, :avatar ] },
                responses: { only: [ :id, :notes, :created_at ] },
                participants: { only: [ :id, :name, :email, :avatar ] },
                activity_participants: { only: [ :id, :user_id, :invited_email, :accepted ] },
                comments: { include: { user: { only: [ :id, :name, :avatar ] } } }
              }
            }
          }
        ).merge("participant_activities" => participant_activities.as_json(
          only: [ :id, :activity_name, :emoji, :user_id, :date_notes, :finalized, :activity_location, :group_size, :date_day, :date_time, :welcome_message, :completed ],
          include: {
            user: { only: [ :id, :name, :email ] },
            participants: { only: [ :id, :name, :email, :avatar ] },
            activity_participants: { only: [ :id, :user_id, :invited_email, :accepted ] }
          }
        ))
      else
        render json: { error: "Not authorized" }, status: :unauthorized
      end
    end

    def send_thank_you
      activity = Activity.find_by(id: params[:id])
      return render json: { error: "Activity not found" }, status: :not_found unless activity

      ThankYouEmailService.send_thank_you_email(activity)
      render json: { message: "Thank-you emails sent!" }, status: :ok
    rescue => e
      render json: { error: e.message }, status: :unprocessable_entity
    end

    def mark_complete
      activity = Activity.find_by(id: params[:id])
      return render(json: { error: "Activity not found" }, status: :not_found) unless activity

      if activity.update(completed: true)
        ActivityCompletionEmailService.send_completion_emails(activity)
        render json: activity, status: :ok
      else
        Rails.logger.error "❌ Activity update failed: #{activity.errors.full_messages}"
        render json: { error: activity.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def share
      @activity = Activity.includes(:participants, :time_slots, :comments)
                          .find(params[:id])

      respond_to do |format|
        format.json { render json: @activity, serializer: FinalizedActivitySerializer }
        format.html { render layout: "share" }
      end
    end

    private

    def activity_params
      params.require(:activity).permit(:activity_name, :activity_type, :finalized, :selected_pinned_id, :activity_location, :group_size, :date_notes, :active, :emoji, :date_day, :date_time, :welcome_message, :completed, participants: [])
    end

    def invite_participant(raw_email, activity)
      invited_email = raw_email.to_s.strip.downcase
      return if invited_email.blank?

      participant = ActivityParticipant.find_or_initialize_by(
        activity_id: activity.id,
        invited_email: invited_email
      )

      return if participant.persisted?  # already invited

      if (user = User.find_by("lower(email) = ?", invited_email))
        participant.user_id = user.id
      end

      participant.accepted = false
      participant.save!

      InviteUserService.send_invitation(activity, invited_email, current_user)
    end
end
