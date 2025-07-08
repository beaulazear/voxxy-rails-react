class ResponsesController < ApplicationController
  before_action :authorized

  def create
    activity = current_user.activities.find_by(id: params[:response][:activity_id]) ||
               Activity.joins(:participants)
                       .where(id: params[:response][:activity_id], participants: { id: current_user.id })
                       .first

    if activity.nil?
      return render json: { error: "Activity not found" }, status: :not_found
    end

    existing_guest_response = activity.responses.find_by(email: current_user.email)

    existing_user_response = activity.responses.find_by(user_id: current_user.id)

    if existing_guest_response
      existing_guest_response.update!(
        user_id: current_user.id,
        email: nil,
        **response_params.except(:availability)
      )
      existing_guest_response.update!(availability: response_params[:availability] || {})
      response = existing_guest_response
    elsif existing_user_response
      existing_user_response.update!(
        **response_params.except(:availability)
      )
      existing_user_response.update!(availability: response_params[:availability] || {})
      response = existing_user_response
    else
      response = activity.responses.build(response_params.except(:availability))
      response.user_id = current_user.id
      response.availability = response_params[:availability] || {}
      response.save!
    end

    activity.responses
            .where(user_id: current_user.id)
            .where.not(id: response.id)
            .destroy_all

    ActivityResponseEmailService.send_response_email(response, activity)
    comment = activity.comments.create!(
      user_id: current_user.id,
      content: "#{current_user.name} has submitted their preferences! 💕"
    )

    render json: {
      response: response,
      comment: comment.as_json(
        include: {
          user: { only: [ :id, :name, :email, :avatar ] }
        }
      )
    }, status: :created

  rescue ActiveRecord::RecordInvalid => e
    render json: { errors: e.record.errors.full_messages }, status: :unprocessable_entity
  end

  def index
    activity = current_user.activities.find_by(id: params[:activity_id])

    if activity
      render json: activity.responses, status: :ok
    else
      render json: { error: "Activity not found" }, status: :not_found
    end
  end

  def destroy
    activity = current_user.activities.find_by(id: params[:activity_id])

    if activity
      response = activity.responses.find_by(id: params[:id])

      if response
        response.destroy
        render json: { message: "Response deleted" }, status: :ok
      else
        render json: { error: "Response not found" }, status: :not_found
      end
    else
      render json: { error: "Activity not found" }, status: :not_found
    end
  end

  private

  def response_params
    params
      .require(:response)
      .permit(:notes, :activity_id, availability: {})
  end
end
