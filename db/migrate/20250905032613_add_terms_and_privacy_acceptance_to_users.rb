class AddTermsAndPrivacyAcceptanceToUsers < ActiveRecord::Migration[7.2]
  def change
    # Terms of Service / EULA tracking
    add_column :users, :terms_accepted_at, :datetime
    add_column :users, :terms_version, :string

    # Privacy Policy tracking
    add_column :users, :privacy_policy_accepted_at, :datetime
    add_column :users, :privacy_policy_version, :string

    # Community Guidelines tracking (for zero-tolerance policy)
    add_column :users, :community_guidelines_accepted_at, :datetime
    add_column :users, :community_guidelines_version, :string

    # Add indexes for quick lookups of users who haven't accepted
    add_index :users, :terms_accepted_at
    add_index :users, :privacy_policy_accepted_at
    add_index :users, :community_guidelines_accepted_at
  end
end
