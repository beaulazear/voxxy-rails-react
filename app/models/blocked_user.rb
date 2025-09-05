class BlockedUser < ApplicationRecord
  belongs_to :blocker, class_name: "User"
  belongs_to :blocked, class_name: "User"

  validates :blocker_id, uniqueness: {
    scope: :blocked_id,
    message: "has already blocked this user"
  }

  validate :cannot_block_self

  private

  def cannot_block_self
    errors.add(:blocked_id, "cannot block yourself") if blocker_id == blocked_id
  end
end
