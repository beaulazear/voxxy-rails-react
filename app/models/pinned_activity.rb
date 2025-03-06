class PinnedActivity < ApplicationRecord
  belongs_to :activity
  has_many :comments, dependent: :destroy
end
