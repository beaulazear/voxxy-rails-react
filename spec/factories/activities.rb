FactoryBot.define do
  factory :activity do
    association :user
    activity_name { Faker::Lorem.sentence(word_count: 3) }
    activity_location { Faker::Address.city }
    group_size { "4-6 people" }
    date_notes { "This weekend" }
    activity_type { [ "restaurant", "bar", "game_night", "movie_night", "trip" ].sample }
    emoji { [ "🍕", "🍺", "🎮", "🎬", "✈️" ].sample }
    welcome_message { "Looking forward to seeing everyone!" }
    active { true }

    trait :inactive do
      active { false }
    end

    trait :completed do
      completed { true }
      date_day { 2.days.ago }
    end

    trait :finalized do
      finalized { true }
      date_day { 7.days.from_now }
      date_time { "2000-01-01 19:00:00" }
    end

    trait :with_future_date do
      date_day { 7.days.from_now }
      date_time { "2000-01-01 18:30:00" }
    end

    trait :collecting do
      collecting { true }
    end

    trait :voting do
      voting { true }
    end

    trait :allow_time_selection do
      allow_participant_time_selection { true }
    end
  end
end
