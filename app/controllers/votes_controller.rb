class VotesController < ApplicationController
    before_action :authorized
    before_action :find_pinned_activity

    def create
        vote = @pinned_activity.votes.new(user: current_user)

        if vote.save
          Rails.logger.debug "Votes response: #{@pinned_activity.votes.select(:id, :user_id)}"

          render json: {
            success: true,
            votes: @pinned_activity.votes.select(:id, :user_id),  # ✅ Ensure this returns an array, not a number!
            voters: @pinned_activity.voters.select(:id, :name, :avatar)
          }
        else
          render json: { error: vote.errors.full_messages.join(", ") }, status: :unprocessable_entity
        end
      end

      def destroy
        vote = Vote.find_by(id: params[:id])

        if vote&.destroy
          Rails.logger.debug "Votes after delete: #{@pinned_activity.votes.select(:id, :user_id)}"

          render json: {
            success: true,
            votes: @pinned_activity.votes.select(:id, :user_id),  # ✅ Make sure this returns an array
            voters: @pinned_activity.voters.select(:id, :name, :avatar)
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
