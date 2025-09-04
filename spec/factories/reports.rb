FactoryBot.define do
  factory :report do
    association :reporter, factory: :user
    association :reportable, factory: :comment
    reason { %w[spam harassment hate inappropriate violence other].sample }
    description { "This content violates community guidelines" }
    status { "pending" }
    resolution_action { nil }
    resolution_notes { nil }
    reviewed_at { nil }
    reviewed_by { nil }
    activity { nil }

    trait :reviewing do
      status { "reviewing" }
      association :reviewed_by, factory: :user
      reviewed_at { Time.current }
    end

    trait :resolved do
      status { "resolved" }
      resolution_action { "content_deleted" }
      resolution_notes { "Content violated terms of service" }
      association :reviewed_by, factory: :user
      reviewed_at { Time.current }
    end

    trait :dismissed do
      status { "dismissed" }
      resolution_action { "dismissed" }
      resolution_notes { "Not a violation" }
      association :reviewed_by, factory: :user
      reviewed_at { Time.current }
    end

    trait :overdue do
      status { "pending" }
      created_at { 25.hours.ago }
    end

    trait :with_activity do
      association :activity
    end
  end
end