class CommentsController < ApplicationController
  before_action :authorized

  def create
    activity = Activity.find_by(id: params[:activity_id])
    return render json: { error: "Activity not found" }, status: :not_found unless activity

    comment = Comment.new(comment_params)
    comment.user_id = current_user.id
    comment.activity_id = activity.id
    comment.pinned_activity_id = params[:pinned_activity_id] if params[:pinned_activity_id].present?

    if comment.save
      # Notification is now sent via after_create callback in Comment model
      render json: comment.as_json(include: { user: { only: [ :id, :name, :email, :avatar ] } }), status: :created
    else
      render json: { error: "Failed to post comment." }, status: :unprocessable_entity
    end
  end

  def index
    commentable = find_commentable
    return render json: { error: "Activity or Pinned Activity not found" }, status: :not_found unless commentable

    # Filter out comments from blocked users
    comments = if current_user
      blocked_user_ids = current_user.blocked_users.pluck(:id)
      commentable.comments.where.not(user_id: blocked_user_ids).includes(:user)
    else
      commentable.comments.includes(:user)
    end

    render json: comments.as_json(
      include: { user: { only: [ :id, :name, :avatar ] } }
    )
  end

  private

  def find_commentable
    if params[:activity_id]
      Activity.find_by(id: params[:activity_id])
    elsif params[:pinned_activity_id]
      PinnedActivity.find_by(id: params[:pinned_activity_id])
    end
  end

  def comment_params
    params.require(:comment).permit(:content)
  end
end
