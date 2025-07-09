# lib/tasks/update_photo_urls.rake
namespace :places do
  desc "Update existing pinned activities with correct photo URLs (including port)"
  task update_photo_urls: :environment do
    puts "🔄 Starting photo URL updates to fix missing port numbers..."

    pinned_activities = PinnedActivity.where.not(photos: [ nil, "" ])
    total = pinned_activities.count
    updated = 0

    pinned_activities.find_each.with_index do |pinned_activity, index|
      puts "📸 Processing #{index + 1}/#{total}: #{pinned_activity.title}"

      begin
        photos = JSON.parse(pinned_activity.photos)
        needs_update = photos.any? do |photo|
          photo["photo_reference"] && (
            !photo["photo_url"] ||
            photo["photo_url"].include?("googleapis.com") || # Replace old Google URLs
            photo["photo_url"].include?("http://localhost/") # Fix missing port
          )
        end

        if needs_update
          places_data = GooglePlacesService.enrich_place_data(
            pinned_activity.title,
            pinned_activity.address
          )

          pinned_activity.update_columns(
            photos: places_data[:photos].to_json,
            reviews: places_data[:reviews].to_json
          )

          updated += 1
          puts "✅ Updated #{pinned_activity.title} with correct URLs"
        else
          puts "⏭️  Skipped #{pinned_activity.title} (already has correct URLs)"
        end

      rescue JSON::ParserError => e
        puts "❌ Failed to parse photos for #{pinned_activity.title}: #{e.message}"
      rescue => e
        puts "❌ Error updating #{pinned_activity.title}: #{e.message}"
      end

      # Rate limiting to avoid hitting Google API limits
      sleep(0.1) if (index + 1) % 10 == 0
    end

    puts "🎉 Completed! Updated #{updated}/#{total} pinned activities with correct URLs"
  end
end
