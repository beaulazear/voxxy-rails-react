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
        availability_count: calculate_availability_count(slot, availability_responses),
        recommendation:     slot.recommendations  # This will return the saved JSONB data
      }
    }
  end

  def create
    slot = @activity.time_slots.find_or_create_by!(slot_params)

    # Automatically set votes based on availability count
    availability_responses = @activity.responses.where(notes: "LetsMeetAvailabilityResponse")

    # Create votes for each user who has this time available
    availability_responses.each do |response|
      begin
        availability = JSON.parse(response.availability.to_json)
        next if availability["open"] == true

        slot_date = slot.date.to_s
        if availability[slot_date].present? && availability[slot_date].is_a?(Array)
          slot_time = slot.time.strftime("%H:%M")
          if availability[slot_date].include?(slot_time)
            # Find the user for this response
            user = response.user_id ? User.find_by(id: response.user_id) : User.find_by(email: response.email)
            if user
              slot.time_slot_votes.find_or_create_by(user: user) do |vote|
                vote.upvote = true
              end
            end
          end
        end
      rescue JSON::ParserError, NoMethodError => e
        Rails.logger.warn "Error parsing availability for response #{response.id}: #{e.message}"
        next
      end
    end

    availability_count = calculate_availability_count(slot, availability_responses)
    render json: slot.as_json(methods: :votes_count).merge(
      availability_count: availability_count,
      recommendation: slot.recommendations
    ), status: :created
  end

  def destroy
    @time_slot.destroy
    head :no_content
  end

  def ai_recommendations
    # Check if recommendations already exist for this activity's time slots
    existing_recommendations = @activity.time_slots.where.not(recommendations: {}).pluck(:recommendations)

    if existing_recommendations.any?
      # Return existing recommendations
      recommendations = existing_recommendations.compact
      render json: { recommendations: recommendations }
    else
      # Generate new recommendations
      availability_responses = @activity.responses.where(notes: "LetsMeetAvailabilityResponse")

      recommendations = fetch_time_slot_recommendations_from_openai(
        availability_responses,
        @activity.activity_location || "the specified location",
        @activity.date_time&.strftime("%B %d, %Y") || "the scheduled date"
      )

      render json: { recommendations: recommendations }
    end
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

  def fetch_time_slot_recommendations_from_openai(responses, activity_location, date_notes)
    client = OpenAI::Client.new(access_token: ENV.fetch("OPENAI_API_KEY"))

    # Process availability data for AI
    availability_summary = process_availability_for_ai(responses)
    time_slots_data = process_time_slots_for_ai(@activity.time_slots)
    total_participants = @activity.participants.count

    prompt = <<~PROMPT
      You are an AI scheduling assistant that analyzes group availability and provides recommendations for the best meeting times.

      Meeting Details:
      • Location: #{activity_location}
      • Date: #{date_notes}
      • Total Participants: #{total_participants} (including organizer)

      Current Time Slot Options with Availability:
      #{time_slots_data}

      Group Availability Summary:
      #{availability_summary}

      IMPORTANT:
      1. **PRIORITIZE maximum participation** - recommend times when the most people are available
      2. Consider different scenarios: "Best for everyone", "Best for most", "Alternative options"
      3. Explain the trade-offs between different time slots
      4. Be specific about participation rates for each recommended time
      5. Consider practical factors like commute times, meal times, work schedules
      6. Keep the tone warm and helpful
      7. If multiple slots have equal availability, consider other factors like timing convenience

      Return exactly **3** recommendations in this structure (valid JSON only, no extra commentary):

      {
        "recommendations": [
          {
            "title": "Best Overall Choice",
            "time_slot_id": null,
            "date": "YYYY-MM-DD",
            "time": "HH:MM",
            "participants_available": 0,
            "reason": "Detailed explanation of why this is the best choice, including participation rate, what makes this time optimal, and any considerations for the group.",
            "pros": ["Specific advantage 1", "Specific advantage 2"],
            "cons": ["Any limitations or considerations"]
          },
          {
            "title": "Alternative Option",#{' '}
            "time_slot_id": null,
            "date": "YYYY-MM-DD",
            "time": "HH:MM",
            "participants_available": 0,
            "reason": "Explanation of this alternative and when it might be preferable.",
            "pros": ["Advantage 1", "Advantage 2"],
            "cons": ["Limitation 1", "Limitation 2"]
          },
          {
            "title": "Compromise Choice",
            "time_slot_id": null,
            "date": "YYYY-MM-DD",#{' '}
            "time": "HH:MM",
            "participants_available": 0,
            "reason": "Explanation of this compromise option and what trade-offs it represents.",
            "pros": ["Advantage 1", "Advantage 2"],
            "cons": ["Limitation 1", "Limitation 2"]
          }
        ]
      }
    PROMPT

    response = client.chat(
      parameters: {
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are an AI assistant that outputs strictly valid JSON." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3
      }
    )

    raw_json = response.dig("choices", 0, "message", "content")

    begin
      parsed = JSON.parse(raw_json)
      recommendations = parsed.fetch("recommendations", [])

      # Match recommendations with actual time slot IDs and save to database
      recommendations.each do |rec|
        matching_slot = @activity.time_slots.find do |slot|
          slot.date.to_s == rec["date"] && slot.time.strftime("%H:%M") == rec["time"]
        end

        if matching_slot
          rec["time_slot_id"] = matching_slot.id
          # Save the recommendation to the time slot
          matching_slot.update(recommendations: rec)
        end
      end

      recommendations
    rescue JSON::ParserError => e
      Rails.logger.warn "Failed to parse AI recommendations: #{e.message}"
      []
    end
  end

  def process_availability_for_ai(responses)
    summary = []
    responses.each_with_index do |response, index|
      begin
        availability = JSON.parse(response.availability.to_json)
        user_name = response.user&.name || response.email || "Participant #{index + 1}"

        if availability["open"] == true
          summary << "#{user_name}: Available anytime"
        else
          available_slots = []
          availability.each do |date, times|
            next unless times.is_a?(Array)
            times.each do |time|
              available_slots << "#{date} at #{time}"
            end
          end
          if available_slots.any?
            summary << "#{user_name}: Available #{available_slots.join(', ')}"
          else
            summary << "#{user_name}: No specific availability submitted"
          end
        end
      rescue JSON::ParserError, NoMethodError => e
        summary << "Participant #{index + 1}: Availability data unavailable"
      end
    end
    summary.join("\n")
  end

  def process_time_slots_for_ai(time_slots)
    if time_slots.empty?
      return "No time slots have been generated yet."
    end

    time_slots.map do |slot|
      "#{slot.date} at #{slot.time.strftime('%H:%M')} - #{slot.votes_count} participants available"
    end.join("\n")
  end
end
