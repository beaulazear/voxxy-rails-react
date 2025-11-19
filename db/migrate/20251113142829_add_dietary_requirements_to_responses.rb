class AddDietaryRequirementsToResponses < ActiveRecord::Migration[7.2]
  def change
    add_column :responses, :dietary_requirements, :text
  end
end
