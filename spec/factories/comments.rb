FactoryBot.define do
  factory :comment do
    association :user
    association :activity
    content { Faker::Lorem.paragraph(sentence_count: 2) }

    trait :on_pinned_activity do
      association :pinned_activity
    end

    trait :short do
      content { Faker::Lorem.sentence }
    end

    trait :long do
      content { Faker::Lorem.paragraph(sentence_count: 5) }
    end
  end
end