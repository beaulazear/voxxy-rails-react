FactoryBot.define do
  factory :activity_participant do
    association :activity
    invited_email { Faker::Internet.email }
    accepted { false }

    trait :accepted do
      association :user
      accepted { true }
    end

    trait :with_user do
      association :user
      invited_email { user&.email }
    end

    trait :with_guest_token do
      guest_response_token { SecureRandom.hex(10) }
    end
  end
end