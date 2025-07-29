FactoryBot.define do
  factory :pinned_activity do
    association :activity
    title { Faker::Restaurant.name }
    hours { "Mon-Sun: 11:00 AM - 10:00 PM" }
    price_range { [ "$", "$$", "$$$", "$$$$" ].sample }
    address { Faker::Address.full_address }
    description { Faker::Restaurant.description }
    reason { Faker::Lorem.paragraph(sentence_count: 2) }
    website { Faker::Internet.url }
    reviews { [] }
    photos { [] }
    selected { false }

    trait :selected do
      selected { true }
    end

    trait :with_reviews do
      reviews { [
        {
          "author_name" => Faker::Name.name,
          "rating" => rand(3..5),
          "text" => Faker::Lorem.paragraph
        },
        {
          "author_name" => Faker::Name.name,
          "rating" => rand(3..5),
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
        },
        {
          "photo_reference" => Faker::Alphanumeric.alphanumeric(number: 10),
          "height" => 1024,
          "width" => 768
        }
      ] }
    end
  end
end
