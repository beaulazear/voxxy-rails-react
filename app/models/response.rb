class Response < ApplicationRecord
  belongs_to :activity
  belongs_to :user

  validates :notes, presence: true
end
