class CreateEmailCampaignTemplates < ActiveRecord::Migration[7.2]
  def change
    create_table :email_campaign_templates do |t|
      # Template ownership
      t.string :template_type, null: false              # 'system' or 'user'
      t.references :organization, foreign_key: true     # NULL for system template

      # Template identity
      t.string :name, null: false                       # "Standard Event Campaign", "My Summer Market Template"
      t.text :description                               # "Complete email campaign for summer markets"
      t.boolean :is_default, default: false             # Only one system default template

      # Metadata
      t.integer :email_count, default: 0                # Counter cache: number of emails in this template
      t.integer :events_count, default: 0               # Counter cache: how many events use this template

      t.timestamps
    end

    add_index :email_campaign_templates, [ :organization_id, :name ], unique: true
    add_index :email_campaign_templates, [ :template_type, :is_default ]
  end
end
