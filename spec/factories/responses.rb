FactoryBot.define do
  factory :response do
    association :activity
    association :user
    notes { "I can make it!" }
    availability { {} }
    
    trait :with_availability do
      availability do
        {
          Date.today.to_s => ["18:00", "19:00", "20:00"],
          (Date.today + 1).to_s => ["19:00", "20:00"]
        }
      end
    end
    
    trait :guest_response do
      user { nil }
      email { Faker::Internet.email }
    end
  end
end