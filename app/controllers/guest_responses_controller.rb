class GuestResponsesController < ApplicationController
  skip_before_action :authorized
  before_action :find_activity_and_participant

  def show
    # Show the guest response form
    @response = @activity.responses.find_by(email: @participant.invited_email)

    # Format activity data the same way the regular activities endpoint does
    activity_json = @activity.as_json(
      include: {
        user: { only: [ :id, :name, :email, :avatar, :profile_pic_url ] },
        participants: { only: [ :id, :name, :email, :avatar, :profile_pic_url ] }
      }
    )

    # Include all the fields that CuisineChat expects
    activity_json.merge!(
      "allow_participant_time_selection" => @activity.allow_participant_time_selection,
      "activity_type" => @activity.activity_type || "Restaurant"
    )

    render json: {
      activity: activity_json,
      existing_response: @response,
      participant_email: @participant.invited_email
    }
  end

  def create
    # Check for existing response from this email
    existing_response = @activity.responses.find_by(email: @participant.invited_email)

    if existing_response
      # Update existing response
      existing_response.update!(
        notes: guest_response_params[:notes],
        availability: guest_response_params[:availability] || {}
      )
      @response = existing_response
    else
      # Create new guest response
      @response = @activity.responses.new
      @response.activity = @activity
      @response.email = @participant.invited_email
      @response.user_id = nil  # Explicitly set to nil for guest
      @response.notes = guest_response_params[:notes]
      @response.availability = guest_response_params[:availability] || {}
      @response.save!
    end

    # Remove any duplicate responses from same email (cleanup)
    @activity.responses
             .where(email: @participant.invited_email)
             .where.not(id: @response.id)
             .destroy_all

    # Send notification email if service exists - but handle errors gracefully
    begin
      if defined?(ActivityResponseEmailService)
        @response.reload
        ActivityResponseEmailService.send_response_email(@response, @activity)
      end
    rescue => e
      Rails.logger.error "Failed to send response email (but response was saved): #{e.message}"
    end

    # Create comment - adjusted for guest users
    begin
      comment = @activity.comments.create!(
        content: "#{@participant.invited_email} has submitted their preferences! 💕"
      )
    rescue => e
      Rails.logger.error "Failed to create comment: #{e.message}"
      comment = nil
    end

    render json: {
      response: {
        id: @response.id,
        notes: @response.notes,
        email: @response.email,
        availability: @response.availability,
        is_guest_response: @response.is_guest_response?,
        created_at: @response.created_at,
        updated_at: @response.updated_at
      },
      comment: comment&.as_json,
      message: "Response submitted successfully! The organizer will send you the final details once everyone has responded."
    }, status: :created

  rescue ActiveRecord::RecordInvalid => e
    Rails.logger.error "Guest response validation failed: #{e.record.errors.full_messages}"
    render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
  rescue => e
    Rails.logger.error "Guest response creation failed: #{e.message}"
    render json: { error: "Unable to save response. Please try again." }, status: :internal_server_error
  end

  private

  def find_activity_and_participant
    @activity = Activity.find(params[:activity_id])
    @participant = @activity.activity_participants.find_by!(guest_response_token: params[:token])

    if @participant.invited_email.blank?
      render json: { error: "Invalid invitation" }, status: :unauthorized
      nil
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Invalid invitation link" }, status: :not_found
  end

  def guest_response_params
    params.require(:response).permit(:notes, availability: {})
  end
end
