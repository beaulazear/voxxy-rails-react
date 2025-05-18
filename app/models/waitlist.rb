class Waitlist < ApplicationRecord
    validates :email,
    presence: true,
    format: { with: URI::MailTo::EMAIL_REGEXP }

    validates :email,
    uniqueness: {
      message: "This email is already signed up for the Voxxy waitlist! 📧"
    }
end
