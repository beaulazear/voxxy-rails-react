class BlocksController < ApplicationController
  before_action :authorize_user

  # POST /users/:id/block
  def create
    user_to_block = User.find(params[:id])

    if current_user.id == user_to_block.id
      render json: { error: "You cannot block yourself" }, status: :unprocessable_entity
      return
    end

    if current_user.block!(user_to_block)
      render json: {
        message: "User blocked successfully",
        blocked_user: {
          id: user_to_block.id,
          name: user_to_block.name,
          email: user_to_block.email,
          profile_pic: user_to_block.profile_pic_url
        }
      }, status: :ok
    else
      render json: { error: "User is already blocked" }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: "User not found" }, status: :not_found
  end

  # DELETE /users/:id/unblock
  def destroy
    user_to_unblock = User.find(params[:id])

    if current_user.unblock!(user_to_unblock)
      render json: {
        message: "User unblocked successfully",
        unblocked_user: {
          id: user_to_unblock.id,
          name: user_to_unblock.name,
          email: user_to_unblock.email
        }
      }, status: :ok
    else
      render json: { error: "User was not blocked" }, status: :unprocessable_entity
    end
  rescue ActiveRecord::RecordNotFound
    render json: { error: "User not found" }, status: :not_found
  end

  # GET /users/blocked
  def index
    blocked_users = current_user.blocked_users

    render json: {
      blocked_users: blocked_users.map do |user|
        {
          id: user.id,
          name: user.name,
          email: user.email,
          profile_pic: user.profile_pic_url
        }
      end,
      total: blocked_users.count
    }, status: :ok
  end

  private

  def authorize_user
    render json: { error: "Unauthorized" }, status: :unauthorized unless current_user
  end
end
