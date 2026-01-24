class PaymentIntegration < ApplicationRecord
  belongs_to :event
  belongs_to :organization
  has_many :payment_transactions, dependent: :destroy
  has_many :payment_sync_logs, dependent: :destroy

  validates :provider, presence: true
  validates :provider, uniqueness: { scope: :event_id }

  enum sync_status: { active: 'active', paused: 'paused', error: 'error', inactive: 'inactive' }

  scope :active_syncs, -> { where(sync_status: 'active', auto_sync_enabled: true) }

  def active?
    sync_status == 'active'
  end

  def paused?
    sync_status == 'paused'
  end

  def needs_sync?
    auto_sync_enabled? && active? && (last_synced_at.nil? || last_synced_at < 15.minutes.ago)
  end
end
