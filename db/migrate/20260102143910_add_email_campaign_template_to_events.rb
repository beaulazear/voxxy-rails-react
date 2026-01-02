class AddEmailCampaignTemplateToEvents < ActiveRecord::Migration[7.2]
  def change
    add_reference :events, :email_campaign_template, foreign_key: true, index: true
  end
end
