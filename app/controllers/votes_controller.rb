class VotesController < ApplicationController
    before_action :authorized
    before_action :find_pinned_activity

    def create
      vote = @pinned_activity.votes.new(user: current_user)

      if vote.save
        render json: {
          success: true,
          votes: @pinned_activity.vote_count,
          voters: @pinned_activity.voters.select(:id, :name, :avatar) # Include voter details
        }
      else
        render json: { error: vote.errors.full_messages.join(", ") }, status: :unprocessable_entity
      end
    end

    def destroy
        vote = Vote.find_by(id: params[:id])

        if vote&.destroy
          render json: {
            success: true,
            votes: vote.pinned_activity.vote_count,
            voters: vote.pinned_activity.voters.select(:id, :name, :avatar)
          }
        else
          render json: { error: "Vote not found" }, status: :not_found
        end
      end

    private

    def find_pinned_activity
      @pinned_activity = PinnedActivity.find(params[:pinned_activity_id])
    end
end
