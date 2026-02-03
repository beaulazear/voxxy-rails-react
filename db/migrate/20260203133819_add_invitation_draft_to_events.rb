class AddInvitationDraftToEvents < ActiveRecord::Migration[7.2]
  def change
    add_column :events, :invitation_list_ids, :jsonb, default: []
    add_column :events, :invitation_contact_ids, :jsonb, default: []
    add_column :events, :invitation_excluded_ids, :jsonb, default: []
    add_column :events, :is_live, :boolean, default: false
  end
end
