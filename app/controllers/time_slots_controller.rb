# app/controllers/time_slots_controller.rb
class TimeSlotsController < ApplicationController
    before_action :authorized
    before_action :set_activity
    before_action :set_time_slot, only: [ :destroy, :vote, :unvote ]

    def index
      @slots = @activity.time_slots
                .left_joins(:time_slot_votes)
                .group("time_slots.id")
                .order(Arel.sql("COUNT(time_slot_votes.id) DESC"))
      render json: @slots.map { |slot|
                {
                  id:          slot.id,
                  date:        slot.date,
                  time:        slot.time,
                  votes_count: slot.votes_count,
                  user_voted:  slot.user_voted?(current_user),
                  voter_ids:   slot.time_slot_votes.pluck(:user_id) # Add this line
                }
      }
    end

    def create
      slot = @activity.time_slots.find_or_create_by!(slot_params)
      render json: slot.as_json(methods: :votes_count), status: :created
    end

    def destroy
      @time_slot.destroy
      head :no_content
    end

    def vote
      vote = @time_slot.time_slot_votes.find_or_initialize_by(user: current_user)
      vote.upvote = true
      vote.save!
      render json: { votes_count: @time_slot.votes_count }
    end

    def unvote
      vote = @time_slot.time_slot_votes.find_by(user: current_user)
      vote&.destroy
      render json: { votes_count: @time_slot.votes_count }
    end

    private

    def set_activity
      @activity = Activity.find(params[:activity_id])
    end

    def set_time_slot
      @time_slot = @activity.time_slots.find(params[:id])
    end

    def slot_params
      params.permit(:date, :time)
    end
end
