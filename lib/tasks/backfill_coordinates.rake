namespace :data do
  desc "Backfill latitude and longitude for existing PinnedActivities and UserActivities"
  task backfill_coordinates: :environment do
    puts "=" * 80
    puts "Starting coordinate backfill process..."
    puts "=" * 80

    # Statistics
    total_pinned = 0
    success_pinned = 0
    failed_pinned = 0
    skipped_pinned = 0

    total_user = 0
    success_user = 0
    failed_user = 0

    # Backfill PinnedActivities
    puts "\n[1/2] Processing PinnedActivities..."
    puts "-" * 80

    PinnedActivity.where("latitude IS NULL OR longitude IS NULL").find_each do |pinned_activity|
      total_pinned += 1

      # Skip if no address
      if pinned_activity.address.blank?
        puts "  ⚠️  Skipping PinnedActivity ##{pinned_activity.id} - No address"
        skipped_pinned += 1
        next
      end

      print "  Processing PinnedActivity ##{pinned_activity.id}: #{pinned_activity.title}..."

      begin
        # Try to geocode using Google Places API
        geocode_url = "https://maps.googleapis.com/maps/api/geocode/json?" \
                      "address=#{CGI.escape(pinned_activity.address)}&key=#{ENV.fetch('PLACES_KEY')}"

        response = Net::HTTP.get_response(URI(geocode_url))
        data = JSON.parse(response.body)

        if data["status"] == "OK" && data["results"].any?
          location = data["results"][0]["geometry"]["location"]
          lat = location["lat"]
          lng = location["lng"]

          pinned_activity.update_columns(
            latitude: lat,
            longitude: lng,
            updated_at: pinned_activity.updated_at # Don't change updated_at
          )

          puts " ✅ Success (#{lat}, #{lng})"
          success_pinned += 1
        else
          puts " ❌ Failed - Geocoding returned: #{data['status']}"
          failed_pinned += 1
        end

        # Rate limiting - be nice to Google API
        sleep(0.2)

      rescue => e
        puts " ❌ Error: #{e.message}"
        failed_pinned += 1
      end
    end

    # Backfill UserActivities from their PinnedActivities
    puts "\n[2/2] Processing UserActivities..."
    puts "-" * 80

    UserActivity.where("latitude IS NULL OR longitude IS NULL").includes(:pinned_activity).find_each do |user_activity|
      total_user += 1

      if user_activity.pinned_activity.latitude.present? && user_activity.pinned_activity.longitude.present?
        print "  Copying coordinates for UserActivity ##{user_activity.id}..."

        user_activity.update_columns(
          latitude: user_activity.pinned_activity.latitude,
          longitude: user_activity.pinned_activity.longitude,
          updated_at: user_activity.updated_at # Don't change updated_at
        )

        puts " ✅ Success"
        success_user += 1
      else
        # Try to geocode directly if PinnedActivity also has no coordinates
        if user_activity.address.present?
          print "  Geocoding UserActivity ##{user_activity.id}..."

          begin
            geocode_url = "https://maps.googleapis.com/maps/api/geocode/json?" \
                          "address=#{CGI.escape(user_activity.address)}&key=#{ENV.fetch('PLACES_KEY')}"

            response = Net::HTTP.get_response(URI(geocode_url))
            data = JSON.parse(response.body)

            if data["status"] == "OK" && data["results"].any?
              location = data["results"][0]["geometry"]["location"]
              lat = location["lat"]
              lng = location["lng"]

              user_activity.update_columns(
                latitude: lat,
                longitude: lng,
                updated_at: user_activity.updated_at
              )

              puts " ✅ Success (#{lat}, #{lng})"
              success_user += 1
            else
              puts " ❌ Failed - Geocoding returned: #{data['status']}"
              failed_user += 1
            end

            sleep(0.2)
          rescue => e
            puts " ❌ Error: #{e.message}"
            failed_user += 1
          end
        else
          puts "  ⚠️  Skipping UserActivity ##{user_activity.id} - No address"
          failed_user += 1
        end
      end
    end

    # Print summary
    puts "\n" + "=" * 80
    puts "BACKFILL COMPLETE"
    puts "=" * 80
    puts "\nPinnedActivities:"
    puts "  Total processed:  #{total_pinned}"
    puts "  ✅ Success:        #{success_pinned}"
    puts "  ❌ Failed:         #{failed_pinned}"
    puts "  ⚠️  Skipped:        #{skipped_pinned}"

    puts "\nUserActivities:"
    puts "  Total processed:  #{total_user}"
    puts "  ✅ Success:        #{success_user}"
    puts "  ❌ Failed:         #{failed_user}"

    puts "\nRemaining records with NULL coordinates:"
    puts "  PinnedActivities: #{PinnedActivity.where('latitude IS NULL OR longitude IS NULL').count}"
    puts "  UserActivities:   #{UserActivity.where('latitude IS NULL OR longitude IS NULL').count}"
    puts "=" * 80
  end

  desc "Check coordinate coverage status"
  task check_coordinate_coverage: :environment do
    puts "=" * 80
    puts "COORDINATE COVERAGE REPORT"
    puts "=" * 80

    pinned_total = PinnedActivity.count
    pinned_with_coords = PinnedActivity.where.not(latitude: nil).where.not(longitude: nil).count
    pinned_null = pinned_total - pinned_with_coords

    user_total = UserActivity.count
    user_with_coords = UserActivity.where.not(latitude: nil).where.not(longitude: nil).count
    user_null = user_total - user_with_coords

    puts "\nPinnedActivities:"
    puts "  Total:              #{pinned_total}"
    puts "  With coordinates:   #{pinned_with_coords} (#{pinned_total > 0 ? (pinned_with_coords * 100.0 / pinned_total).round(1) : 0}%)"
    puts "  Without coordinates: #{pinned_null} (#{pinned_total > 0 ? (pinned_null * 100.0 / pinned_total).round(1) : 0}%)"

    puts "\nUserActivities:"
    puts "  Total:              #{user_total}"
    puts "  With coordinates:   #{user_with_coords} (#{user_total > 0 ? (user_with_coords * 100.0 / user_total).round(1) : 0}%)"
    puts "  Without coordinates: #{user_null} (#{user_total > 0 ? (user_null * 100.0 / user_total).round(1) : 0}%)"

    puts "=" * 80
  end
end
