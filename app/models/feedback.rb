# app/models/feedback.rb
class Feedback < ApplicationRecord
    validates :name, :email, :rating, :message, presence: true
    validates :rating, inclusion: { in: 1..5 }
end
