# app/models/contact.rb
class Contact < ApplicationRecord
    validates :name, :email, :subject, :message, presence: true
end
