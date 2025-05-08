class Response < ApplicationRecord
  belongs_to :activity
  belongs_to :user

  store_accessor :availability

  validates :notes, presence: true
end
