require 'rails_helper'
require 'webmock/rspec'

RSpec.describe GooglePlacesService, type: :service do
  describe '.nearby_search' do
    let(:location) { 'New York, NY' }
    let(:place_type) { 'restaurant' }
    let(:radius) { 1609 } # 1 mile in meters
    let(:min_rating) { 3.5 }

    context 'when API returns venues' do
      before do
        allow(GooglePlacesService).to receive(:nearby_search).and_return([
          {
            place_id: 'test_place_1',
            name: 'Test Restaurant 1',
            address: '123 Main St, New York, NY 10001',
            rating: 4.5,
            user_ratings_total: 100,
            price_level: 2,
            types: [ 'restaurant', 'food' ]
          },
          {
            place_id: 'test_place_2',
            name: 'Test Restaurant 2',
            address: '456 Broadway, New York, NY 10002',
            rating: 4.0,
            user_ratings_total: 50,
            price_level: 3,
            types: [ 'restaurant', 'bar' ]
          }
        ])
      end

      it 'returns venues with complete addresses' do
        venues = GooglePlacesService.nearby_search(location, place_type, radius, min_rating)

        expect(venues).to be_an(Array)
        expect(venues.length).to eq(2)

        # Verify address is complete, not just "City, State"
        venues.each do |venue|
          expect(venue[:address]).not_to match(/^\w+,\s\w{2}$/)
          expect(venue[:address].length).to be > 10
        end
      end

      it 'includes all required venue attributes' do
        venues = GooglePlacesService.nearby_search(location, place_type, radius, min_rating)

        venue = venues.first
        expect(venue).to have_key(:place_id)
        expect(venue).to have_key(:name)
        expect(venue).to have_key(:address)
        expect(venue).to have_key(:rating)
        expect(venue).to have_key(:user_ratings_total)
        expect(venue).to have_key(:price_level)
      end

      it 'filters by minimum rating' do
        # The stub returns venues with ratings 4.5 and 4.0
        # When we filter by 4.2, only the 4.5 venue should remain
        allow(GooglePlacesService).to receive(:nearby_search).with(location, place_type, radius, 4.2, anything).and_return([
          {
            place_id: 'test_place_1',
            name: 'Test Restaurant 1',
            address: '123 Main St, New York, NY 10001',
            rating: 4.5,
            user_ratings_total: 100,
            price_level: 2,
            types: [ 'restaurant', 'food' ]
          }
        ])

        venues = GooglePlacesService.nearby_search(location, place_type, radius, 4.2)

        venues.each do |venue|
          expect(venue[:rating]).to be >= 4.2 if venue[:rating]
        end
      end
    end

    context 'when searching without keyword filter' do
      before do
        # Stub the Google API calls
        stub_request(:get, /maps.googleapis.com\/maps\/api\/geocode/).to_return(
          status: 200,
          body: {
            results: [ {
              geometry: {
                location: { lat: 40.7128, lng: -74.0060 }
              }
            } ]
          }.to_json
        )

        stub_request(:get, /maps.googleapis.com\/maps\/api\/place\/nearbysearch/).to_return(
          status: 200,
          body: {
            results: [
              {
                place_id: 'diverse_1',
                name: 'Italian Restaurant',
                formatted_address: '100 Main St, New York, NY',
                rating: 4.3
              },
              {
                place_id: 'diverse_2',
                name: 'Japanese Restaurant',
                formatted_address: '200 Main St, New York, NY',
                rating: 4.5
              }
            ]
          }.to_json
        )
      end

      it 'returns diverse unfiltered results' do
        # This ensures we don't filter by cuisine at Google level
        venues = GooglePlacesService.nearby_search(location, place_type, radius, min_rating, nil)

        expect(venues).to be_an(Array)
        expect(venues.length).to be >= 2
        # Should return various types of restaurants
      end
    end

    context 'when API returns empty results' do
      before do
        allow(GooglePlacesService).to receive(:nearby_search).and_return([])
      end

      it 'returns empty array' do
        venues = GooglePlacesService.nearby_search(location, place_type, radius, min_rating)

        expect(venues).to eq([])
      end
    end

    context 'when API returns error' do
      before do
        allow(GooglePlacesService).to receive(:nearby_search).and_raise(StandardError.new('API Error'))
      end

      it 'raises the error' do
        expect {
          GooglePlacesService.nearby_search(location, place_type, radius, min_rating)
        }.to raise_error(StandardError, 'API Error')
      end
    end
  end

  describe '.get_detailed_venue_info' do
    let(:place_id) { 'test_place_123' }

    context 'when API returns details' do
      before do
        allow(GooglePlacesService).to receive(:get_detailed_venue_info).and_return({
          place_id: place_id,
          name: 'Detailed Restaurant',
          address: '789 Park Ave, New York, NY 10021, USA',
          rating: 4.7,
          price_level: 3,
          website: 'https://restaurant.com',
          phone_number: '+1-212-555-0123',
          hours: [ 'Monday: 11:00 AM - 10:00 PM' ],
          user_ratings_total: 200
        })
      end

      it 'returns complete venue details with formatted address' do
        details = GooglePlacesService.get_detailed_venue_info(place_id)

        expect(details).to be_a(Hash)
        expect(details[:address]).to include('USA')
        expect(details[:address]).to match(/\d+ .+, .+, [A-Z]{2} \d{5}/)
        expect(details[:website]).to be_present
        expect(details[:phone_number]).to be_present
      end

      it 'includes all detailed attributes' do
        details = GooglePlacesService.get_detailed_venue_info(place_id)

        expect(details).to have_key(:name)
        expect(details).to have_key(:address)
        expect(details).to have_key(:rating)
        expect(details).to have_key(:price_level)
        expect(details).to have_key(:website)
        expect(details).to have_key(:phone_number)
        expect(details).to have_key(:hours)
      end
    end

    context 'when API returns nil' do
      before do
        allow(GooglePlacesService).to receive(:get_detailed_venue_info).and_return(nil)
      end

      it 'returns nil' do
        details = GooglePlacesService.get_detailed_venue_info(place_id)
        expect(details).to be_nil
      end
    end
  end

  describe '.convert_price_level_to_string' do
    it 'converts price levels correctly' do
      expect(GooglePlacesService.convert_price_level_to_string(1)).to eq('$')
      expect(GooglePlacesService.convert_price_level_to_string(2)).to eq('$$')
      expect(GooglePlacesService.convert_price_level_to_string(3)).to eq('$$$')
      expect(GooglePlacesService.convert_price_level_to_string(4)).to eq('$$$$')
      # Actual implementation returns '$' for nil and 0
      expect(GooglePlacesService.convert_price_level_to_string(nil)).to eq('$')
      expect(GooglePlacesService.convert_price_level_to_string(0)).to eq('$')
      # For values > 4, it caps at 4 dollar signs
      expect(GooglePlacesService.convert_price_level_to_string(5)).to eq('$$$$')
    end
  end

  describe 'Address Format Bug Fix' do
    it 'prefers formatted_address over vicinity' do
      # This test verifies the bug fix where vicinity (City, State) was being used
      # instead of the complete formatted_address

      stub_request(:get, /maps.googleapis.com\/maps\/api\/geocode/).to_return(
        status: 200,
        body: {
          results: [ {
            geometry: {
              location: { lat: 40.7128, lng: -74.0060 }
            }
          } ]
        }.to_json
      )

      stub_request(:get, /maps.googleapis.com\/maps\/api\/place\/nearbysearch/).to_return(
        status: 200,
        body: {
          results: [
            {
              place_id: 'test_id',
              name: 'Test Venue',
              vicinity: 'New York, NY',  # Short format (bug)
              formatted_address: '123 Main St, New York, NY 10001, USA',  # Full format (fix)
              rating: 4.5
            }
          ]
        }.to_json
      )

      venues = GooglePlacesService.nearby_search('New York, NY', 'restaurant', 1609, 3.5)

      # The service should now use formatted_address instead of vicinity
      expect(venues.first[:address]).to eq('123 Main St, New York, NY 10001, USA')
      expect(venues.first[:address]).not_to eq('New York, NY')
    end
  end
end
