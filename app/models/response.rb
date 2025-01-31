class Response < ApplicationRecord
  belongs_to :activity

  validates :notes, presence: true
end
