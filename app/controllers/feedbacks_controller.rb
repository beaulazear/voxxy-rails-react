# app/controllers/feedbacks_controller.rb
class FeedbacksController < ApplicationController
  skip_before_action :authorized, only: [ :create ]

    def index
      @feedbacks = Feedback.all
      render json: @feedbacks
    end

    def show
      @feedback = Feedback.find(params[:id])
      render json: @feedback
    end

    def create
      @feedback = Feedback.new(feedback_params)
      if @feedback.save
        render json: @feedback, status: :created
      else
        render json: { errors: @feedback.errors.full_messages }, status: :unprocessable_entity
      end
    end

    private

    def feedback_params
      params.require(:feedback).permit(:name, :email, :rating, :message)
    end
end
