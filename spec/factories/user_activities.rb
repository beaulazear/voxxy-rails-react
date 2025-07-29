FactoryBot.define do
  factory :user_activity do
    association :user
    association :pinned_activity
    
    # Core fields (will be copied from pinned_activity)
    title { pinned_activity&.title || Faker::Restaurant.name }
    hours { pinned_activity&.hours || "Mon-Sun: 11:00 AM - 10:00 PM" }
    price_range { pinned_activity&.price_range || ["$", "$$", "$$$", "$$$$"].sample }
    address { pinned_activity&.address || Faker::Address.full_address }
    description { pinned_activity&.description || Faker::Restaurant.description }
    reason { pinned_activity&.reason || Faker::Lorem.paragraph(sentence_count: 2) }
    website { pinned_activity&.website || Faker::Internet.url }
    reviews { pinned_activity&.reviews || [] }
    photos { pinned_activity&.photos || [] }
    
    # User interaction fields
    flagged { false }
    favorited { false }

    trait :flagged do
      flagged { true }
    end

    trait :favorited do
      favorited { true }
    end

    trait :flagged_and_favorited do
      flagged { true }
      favorited { true }
    end

    trait :with_reviews do
      reviews { [
        {
          "author_name" => Faker::Name.name,
          "rating" => rand(1..5),
          "text" => Faker::Lorem.paragraph
        }
      ] }
    end

    trait :with_photos do
      photos { [
        {
          "photo_reference" => Faker::Alphanumeric.alphanumeric(number: 10),
          "height" => 1600,
          "width" => 1200
        }
      ] }
    end

    # After creating, copy data from pinned_activity if needed
    after(:build) do |user_activity|
      if user_activity.pinned_activity && user_activity.title.blank?
        user_activity.copy_from_pinned_activity
      end
    end
  end
end