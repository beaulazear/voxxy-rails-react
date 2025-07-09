class AddRecommendationsToTimeSlots < ActiveRecord::Migration[7.2]
  def change
    add_column :time_slots, :recommendations, :jsonb, default: {}
  end
end
