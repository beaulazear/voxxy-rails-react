FactoryBot.define do
  factory :time_slot do
    association :activity
    date { 1.week.from_now.to_date }
    time { Time.parse("19:00") }
    recommendations { {} }

    trait :with_recommendations do
      recommendations { 
        {
          "restaurants" => ["Pizza Palace", "Burger Barn"],
          "bars" => ["The Local Pub", "Craft Corner"]
        }
      }
    end

    trait :tomorrow_evening do
      date { 1.day.from_now.to_date }
      time { Time.parse("18:30") }
    end

    trait :next_week do
      date { 1.week.from_now.to_date }
      time { Time.parse("20:00") }
    end
  end
end