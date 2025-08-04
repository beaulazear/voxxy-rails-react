FactoryBot.define do
  factory :vote do
    association :user
    association :pinned_activity
    upvote { true }

    trait :downvote do
      upvote { false }
    end
  end
end
