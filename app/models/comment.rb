class Comment < ApplicationRecord
  belongs_to :user
  belongs_to :activity, optional: true
  belongs_to :pinned_activity, optional: true

  validates :content, presence: true
end
