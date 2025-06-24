class TimeSlotsController < ApplicationController
    before_action :authorized
    before_action :set_activity
    before_action :set_time_slot, only: [ :destroy, :vote, :unvote ]

    def index
      @slots = @activity.time_slots
                .left_joins(:time_slot_votes)
                .group("time_slots.id")
                .order(Arel.sql("COUNT(time_slot_votes.id) DESC"))

      availability_responses = @activity.responses.where(notes: "LetsMeetAvailabilityResponse")

      render json: @slots.map { |slot|
                {
                  id:                 slot.id,
                  date:               slot.date,
                  time:               slot.time,
                  votes_count:        slot.votes_count,
                  user_voted:         slot.user_voted?(current_user),
                  voter_ids:          slot.time_slot_votes.pluck(:user_id),
                  availability_count: calculate_availability_count(slot, availability_responses)
                }
      }
    end

    def create
      slot = @activity.time_slots.find_or_create_by!(slot_params)

      availability_responses = @activity.responses.where(notes: "LetsMeetAvailabilityResponse")
      availability_count = calculate_availability_count(slot, availability_responses)

      render json: slot.as_json(methods: :votes_count).merge(availability_count: availability_count), status: :created
    end

    def destroy
      @time_slot.destroy
      head :no_content
    end

    def vote
      vote = @time_slot.time_slot_votes.find_or_initialize_by(user: current_user)
      vote.upvote = true
      vote.save!

      availability_responses = @activity.responses.where(notes: "LetsMeetAvailabilityResponse")
      availability_count = calculate_availability_count(@time_slot, availability_responses)

      render json: {
        votes_count: @time_slot.votes_count,
        availability_count: availability_count
      }
    end

    def unvote
      vote = @time_slot.time_slot_votes.find_by(user: current_user)
      vote&.destroy

      availability_responses = @activity.responses.where(notes: "LetsMeetAvailabilityResponse")
      availability_count = calculate_availability_count(@time_slot, availability_responses)

      render json: {
        votes_count: @time_slot.votes_count,
        availability_count: availability_count
      }
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

    def calculate_availability_count(slot, availability_responses)
      count = 0

      availability_responses.each do |response|
        begin
          availability = JSON.parse(response.availability.to_json)

          next if availability["open"] == true

          slot_date = slot.date.to_s
          if availability[slot_date].present? && availability[slot_date].is_a?(Array)
            slot_time = slot.time.strftime("%H:%M")  # This gives us "09:00", "10:00", etc.
            if availability[slot_date].include?(slot_time)
              count += 1
            end
          end
        rescue JSON::ParserError, NoMethodError => e
          Rails.logger.warn "Error parsing availability for response #{response.id}: #{e.message}"
          next
        end
      end

      count
    end
end
