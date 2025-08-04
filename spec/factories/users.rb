FactoryBot.define do
  factory :user do
    name { Faker::Name.name }
    email { Faker::Internet.unique.email }
    password { "password123" }
    password_confirmation { "password123" }
    confirmed_at { Time.current }

    trait :unconfirmed do
      confirmed_at { nil }
      confirmation_token { SecureRandom.hex(10) }
    end

    trait :admin do
      admin { true }
    end

    trait :with_avatar do
      avatar { "Avatar#{rand(1..11)}.jpg" }
    end

    trait :with_preferences do
      preferences { "vegetarian, no seafood" }
    end

    trait :notifications_disabled do
      email_notifications { false }
      text_notifications { false }
      push_notifications { false }
    end

    trait :with_push_token do
      push_notifications { true }
      push_token { "ExponentPushToken[#{SecureRandom.hex(20)}]" }
      platform { "ios" }
    end

    trait :android_user do
      push_notifications { true }
      push_token { "ExponentPushToken[#{SecureRandom.hex(20)}]" }
      platform { "android" }
    end

    trait :with_reset_token do
      reset_password_token { SecureRandom.hex(10) }
      reset_password_sent_at { 1.hour.ago }
    end
  end
end
