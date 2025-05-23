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

    response = activity.responses.build(response_params.except(:availability))
    response.user_id      = current_user.id
    response.availability = response_params[:availability] || {}

    if response.save
      activity.responses
              .where(user_id: current_user.id)
              .where.not(id: response.id)
              .destroy_all

      render json: response, status: :created
    else
      render json: { errors: response.errors.full_messages }, status: :unprocessable_entity
    end
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
