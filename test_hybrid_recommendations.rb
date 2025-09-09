# Test script for hybrid recommendation system
# Run with: bundle exec rails runner test_hybrid_recommendations.rb

require 'json'

def test_hybrid_approach
  puts "\n" + "="*80
  puts "TESTING HYBRID RECOMMENDATION SYSTEM"
  puts "="*80 + "\n"

  # Test parameters
  test_cases = [
    {
      name: "Brooklyn Vegan Test",
      location: "Brooklyn, NY",
      preferences: "Vegan restaurants only, budget-friendly",
      date_notes: "Saturday evening",
      radius: 5
    },
    {
      name: "Manhattan Late Night",
      location: "Manhattan, NY",
      preferences: "Late night bars with craft cocktails",
      date_notes: "Friday night at 11pm",
      radius: 3
    }
  ]

  test_cases.each do |test|
    puts "\n" + "-"*60
    puts "Test: #{test[:name]}"
    puts "-"*60
    puts "Location: #{test[:location]}"
    puts "Preferences: #{test[:preferences]}"
    puts "Date: #{test[:date_notes]}"
    puts "Radius: #{test[:radius]} miles"
    puts "-"*60

    # Test Google Places Nearby Search
    puts "\n1. Testing Google Places Nearby Search..."
    begin
      radius_meters = test[:radius] * 1609
      venues = GooglePlacesService.nearby_search(
        test[:location],
        "restaurant",
        radius_meters,
        3.5
      )

      if venues.any?
        puts "   ✅ Found #{venues.length} operational venues"
        puts "   Sample venues:"
        venues.first(3).each do |v|
          puts "      - #{v[:name]} (#{v[:rating]}/5, #{v[:user_ratings_total]} reviews)"
        end
      else
        puts "   ⚠️ No venues found"
      end
    rescue => e
      puts "   ❌ Error: #{e.message}"
    end

    # Test hybrid recommendation
    puts "\n2. Testing Hybrid Recommendation..."
    begin
      controller = OpenaiController.new
      recommendations = controller.send(
        :fetch_hybrid_restaurant_recommendations,
        test[:preferences],
        test[:location],
        test[:date_notes],
        test[:radius]
      )

      if recommendations && recommendations.any?
        puts "   ✅ Generated #{recommendations.length} personalized recommendations"
        recommendations.each_with_index do |rec, i|
          puts "\n   #{i+1}. #{rec['name']} (#{rec['price_range']})"
          puts "      Address: #{rec['address']}"
          puts "      Hours: #{rec['hours']}"
          puts "      Description: #{rec['description']}"
          puts "      Reason: #{rec['reason'][0..150]}..."
        end
      else
        puts "   ⚠️ No recommendations generated"
      end
    rescue => e
      puts "   ❌ Error: #{e.message}"
      puts "   #{e.backtrace.first(3).join("\n   ")}"
    end
  end

  # Test response format consistency
  puts "\n" + "="*80
  puts "TESTING RESPONSE FORMAT CONSISTENCY"
  puts "="*80

  controller = OpenaiController.new
  hybrid_result = controller.send(
    :fetch_hybrid_restaurant_recommendations,
    "Italian food, romantic atmosphere",
    "SoHo, New York",
    "Friday evening",
    5
  )

  if hybrid_result && hybrid_result.first
    puts "\n✅ Response format check:"
    required_fields = [ "name", "price_range", "description", "reason", "hours", "website", "address" ]
    sample = hybrid_result.first

    required_fields.each do |field|
      if sample.key?(field)
        puts "   ✓ #{field}: present"
      else
        puts "   ✗ #{field}: MISSING"
      end
    end
  end

  puts "\n" + "="*80
  puts "TEST COMPLETE"
  puts "="*80
end

# Run the test
test_hybrid_approach
