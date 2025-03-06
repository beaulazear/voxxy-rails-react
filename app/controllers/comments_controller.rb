class CommentsController < ApplicationController
    before_action :authorized

    def create
      pinned_activity = PinnedActivity.find(params[:pinned_activity_id])
      comment = pinned_activity.comments.build(comment_params.merge(user_id: @current_user.id))

      if comment.save
        render json: comment, status: :created
      else
        render json: { errors: comment.errors.full_messages }, status: :unprocessable_entity
      end
    end

    private

    def comment_params
      params.require(:comment).permit(:content)
    end
end
