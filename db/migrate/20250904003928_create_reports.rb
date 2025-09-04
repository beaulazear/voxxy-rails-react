class CreateReports < ActiveRecord::Migration[7.2]
  def change
    create_table :reports do |t|
      # Polymorphic association for reportable content
      t.string :reportable_type, null: false
      t.bigint :reportable_id, null: false

      # Report details
      t.string :reason, null: false
      t.text :description

      # User associations
      t.references :reporter, null: false, foreign_key: { to_table: :users }
      t.references :activity, null: true, foreign_key: true

      # Status tracking
      t.string :status, default: 'pending', null: false
      t.datetime :reviewed_at
      t.references :reviewed_by, null: true, foreign_key: { to_table: :users }

      # Resolution details
      t.string :resolution_action # deleted, warned, banned, dismissed
      t.text :resolution_notes
      t.text :internal_notes # For admin use only

      t.timestamps
    end

    # Add indexes for performance
    add_index :reports, [ :reportable_type, :reportable_id ]
    add_index :reports, :status
    add_index :reports, :reason
    add_index :reports, :created_at
    add_index :reports, [ :reporter_id, :reportable_type, :reportable_id ],
              unique: true,
              name: 'index_reports_on_reporter_and_reportable'
  end
end
