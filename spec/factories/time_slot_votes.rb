FactoryBot.define do
  factory :time_slot_vote do
    association :user
    association :time_slot
    upvote { true }

    trait :downvote do
      upvote { false }
    end
  end
end
