FactoryBot.define do
  factory :moderation_action do
    association :user
    association :moderator, factory: :user
    action_type { "warned" }
    reason { "Content violation" }
    report { nil }
    expires_at { nil }

    trait :warning do
      action_type { "warned" }
    end

    trait :suspension do
      action_type { "suspended" }
      expires_at { 7.days.from_now }
    end

    trait :ban do
      action_type { "banned" }
    end

    trait :unbanned do
      action_type { "unbanned" }
    end

    trait :content_removed do
      action_type { "content_removed" }
    end

    trait :with_report do
      association :report
    end

    trait :expired do
      expires_at { 1.day.ago }
    end

    trait :active do
      expires_at { 1.day.from_now }
    end
  end
end