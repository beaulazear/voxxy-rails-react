class ResponsesController < ApplicationController
    before_action :authorized

    def create
        activity = current_user.activities.find_by(id: params[:response][:activity_id]) # Ensure correct lookup

        if activity
          response = activity.responses.build(response_params)

          if response.save
            render json: response, status: :created
          else
            render json: { errors: response.errors.full_messages }, status: :unprocessable_entity
          end
        else
          render json: { error: "Activity not found" }, status: :not_found
        end
      end

    def index
      activity = current_user.activities.find_by(id: params[:activity_id])

      if activity
        responses = activity.responses
        render json: responses, status: :ok
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
      params.require(:response).permit(:notes)
    end
end
