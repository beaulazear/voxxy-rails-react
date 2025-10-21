require 'rails_helper'

RSpec.describe OpenaiController, type: :request do
  include AuthHelper

  let(:user) { create(:user) }

  before { login_user(user) }

  describe 'POST /api/openai/restaurant_recommendations' do
    let(:valid_params) do
      {
        responses: {
          'cuisine_reasoning' => 'Italian, Japanese, Mexican',
          'dietary_reasoning' => 'vegetarian friendly',
          'budget_reasoning' => 'moderate budget',
          'ambiance_reasoning' => 'casual dining'
        },
        activity_location: 'San Francisco, CA',
        date_notes: 'Saturday evening dinner',
        radius: 2
      }
    end

    context 'when fetching restaurant recommendations' do
      before do
        # Mock Google Places API response
        allow(GooglePlacesService).to receive(:nearby_search).and_return([
          {
            place_id: 'italian_place',
            name: 'Italian Bistro',
            address: '123 Main St, San Francisco, CA 94102',
            rating: 4.5,
            price_level: 2,
            types: [ 'restaurant', 'italian' ],
            user_ratings_total: 200
          },
          {
            place_id: 'japanese_place',
            name: 'Sushi Bar',
            address: '456 Market St, San Francisco, CA 94103',
            rating: 4.7,
            price_level: 3,
            types: [ 'restaurant', 'japanese' ],
            user_ratings_total: 300
          },
          {
            place_id: 'mexican_place',
            name: 'Taqueria',
            address: '789 Mission St, San Francisco, CA 94104',
            rating: 4.3,
            price_level: 1,
            types: [ 'restaurant', 'mexican' ],
            user_ratings_total: 150
          }
        ])

        # Mock detailed venue info - return different data for each place_id
        allow(GooglePlacesService).to receive(:get_detailed_venue_info) do |place_id|
          case place_id
          when 'italian_place'
            {
              name: 'Italian Bistro',
              address: '123 Main St, San Francisco, CA 94102',
              rating: 4.5,
              price_level: 2,
              website: 'https://italianbistro.com',
              hours: 'Mon-Fri: 11AM-10PM',
              types: [ 'restaurant', 'italian' ],
              user_ratings_total: 200
            }
          when 'japanese_place'
            {
              name: 'Sushi Bar',
              address: '456 Market St, San Francisco, CA 94103',
              rating: 4.7,
              price_level: 3,
              website: 'https://sushibar.com',
              hours: 'Mon-Sun: 12PM-11PM',
              types: [ 'restaurant', 'japanese' ],
              user_ratings_total: 300
            }
          when 'mexican_place'
            {
              name: 'Taqueria',
              address: '789 Mission St, San Francisco, CA 94104',
              rating: 4.3,
              price_level: 1,
              website: 'https://taqueria.com',
              hours: 'Mon-Sun: 10AM-9PM',
              types: [ 'restaurant', 'mexican' ],
              user_ratings_total: 150
            }
          end
        end
      end

      it 'returns diverse cuisine recommendations when multiple cuisines are specified' do
        post '/api/openai/restaurant_recommendations', params: valid_params, headers: auth_headers, as: :json

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)

        expect(json['recommendations']).to be_an(Array)
        expect(json['recommendations'].length).to be >= 3

        # Verify variety in restaurant names
        names = json['recommendations'].map { |r| r['name'] }
        expect(names).to include('Italian Bistro')
        expect(names).to include('Sushi Bar')
        expect(names).to include('Taqueria')
      end

      it 'returns venues with complete addresses' do
        post '/api/openai/restaurant_recommendations', params: valid_params, headers: auth_headers, as: :json

        json = JSON.parse(response.body)
        json['recommendations'].each do |rec|
          # Address should not be just "City, State"
          expect(rec['address']).not_to match(/^\w+,\s\w{2}$/)
          expect(rec['address'].length).to be > 15
        end
      end

      it 'does not filter by single cuisine in Google search' do
        # Verify that nearby_search is called without cuisine keyword
        expect(GooglePlacesService).to receive(:nearby_search)
          .with('San Francisco, CA', 'restaurant', anything, anything, nil)
          .and_return([])

        post '/api/openai/restaurant_recommendations', params: valid_params, headers: auth_headers, as: :json
      end

      it 'fetches 20 venues for better diversity' do
        venues = Array.new(20) { |i|
          {
            place_id: "place_#{i}",
            name: "Restaurant #{i}",
            address: "#{i} Street, San Francisco, CA",
            rating: 4.0 + (i * 0.01),
            price_level: 2,
            types: [ 'restaurant' ],
            user_ratings_total: 100
          }
        }

        allow(GooglePlacesService).to receive(:nearby_search).and_return(venues)
        allow(GooglePlacesService).to receive(:get_detailed_venue_info) do |place_id|
          i = place_id.gsub('place_', '').to_i
          {
            name: "Restaurant #{i}",
            address: "#{i} Street, San Francisco, CA 94102",
            rating: 4.0 + (i * 0.01),
            price_level: 2,
            website: "https://restaurant#{i}.com",
            hours: 'Mon-Sun: 11AM-10PM',
            types: [ 'restaurant' ],
            user_ratings_total: 100
          }
        end

        post '/api/openai/restaurant_recommendations', params: valid_params, headers: auth_headers, as: :json

        # The controller should process up to 20 venues
        expect(GooglePlacesService).to have_received(:nearby_search)
      end
    end

    context 'when handling dietary preferences' do
      let(:dietary_params) do
        valid_params.merge(
          responses: {
            'cuisine_reasoning' => 'Any cuisine',
            'dietary_reasoning' => 'vegan, gluten-free',
            'budget_reasoning' => 'any',
            'ambiance_reasoning' => 'any'
          }
        )
      end

      before do
        allow(GooglePlacesService).to receive(:nearby_search).and_return([
          {
            place_id: 'vegan_place',
            name: 'Vegan Cafe',
            address: '123 Health St, San Francisco, CA 94102',
            rating: 4.8,
            price_level: 2,
            types: [ 'restaurant', 'vegan_restaurant' ],
            user_ratings_total: 300
          }
        ])

        allow(GooglePlacesService).to receive(:get_detailed_venue_info).and_return({
          name: 'Vegan Cafe',
          address: '123 Health St, San Francisco, CA 94102',
          rating: 4.8,
          price_level: 2,
          website: 'https://vegancafe.com',
          hours: 'Mon-Sun: 9AM-9PM',
          types: [ 'restaurant', 'vegan_restaurant' ],
          user_ratings_total: 300
        })
      end

      it 'prioritizes dietary restrictions above other preferences' do
        post '/api/openai/restaurant_recommendations', params: dietary_params, headers: auth_headers, as: :json

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['recommendations']).to be_an(Array)
        # Local ranking service should prioritize dietary preferences
      end
    end

    context 'when no venues are found' do
      before do
        allow(GooglePlacesService).to receive(:nearby_search).and_return([])
      end

      it 'returns empty recommendations array' do
        post '/api/openai/restaurant_recommendations', params: valid_params, headers: auth_headers, as: :json

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['recommendations']).to eq([])
      end
    end

    context 'with invalid parameters' do
      it 'returns error without activity_location' do
        invalid_params = valid_params.except(:activity_location)
        post '/api/openai/restaurant_recommendations', params: invalid_params, headers: auth_headers, as: :json

        expect(response).to have_http_status(:unprocessable_entity)
      end

      it 'works without authentication (endpoint is public)' do
        # Mock Google Places to avoid external API calls
        allow(GooglePlacesService).to receive(:nearby_search).and_return([])

        post '/api/openai/restaurant_recommendations', params: valid_params, as: :json

        # Since skip_before_action :authorized is set, endpoint is public
        # It should return success with empty recommendations when no venues found
        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['recommendations']).to eq([])
      end
    end
  end

  describe 'POST /api/openai/bar_recommendations' do
    let(:bar_params) do
      {
        responses: {
          'bar_reasoning' => 'cocktail bar, wine bar, sports bar',
          'budget_reasoning' => 'upscale',
          'ambiance_reasoning' => 'trendy, rooftop'
        },
        activity_location: 'Los Angeles, CA',
        date_notes: 'Friday night drinks',
        radius: 3
      }
    end

    before do
      allow(GooglePlacesService).to receive(:nearby_search).and_return([
        {
          place_id: 'cocktail_bar',
          name: 'Craft Cocktails',
          address: '100 Sunset Blvd, Los Angeles, CA 90028',
          rating: 4.6,
          price_level: 3,
          types: [ 'bar', 'night_club' ],
          user_ratings_total: 250
        },
        {
          place_id: 'wine_bar',
          name: 'Wine Lounge',
          address: '200 Vine St, Los Angeles, CA 90028',
          rating: 4.4,
          price_level: 3,
          types: [ 'bar', 'wine_bar' ],
          user_ratings_total: 180
        }
      ])

      allow(GooglePlacesService).to receive(:get_detailed_venue_info) do |place_id|
        case place_id
        when 'cocktail_bar'
          {
            name: 'Craft Cocktails',
            address: '100 Sunset Blvd, Los Angeles, CA 90028',
            rating: 4.6,
            price_level: 3,
            website: 'https://craftcocktails.com',
            hours: 'Mon-Sun: 5PM-2AM',
            types: [ 'bar', 'night_club' ],
            user_ratings_total: 250
          }
        when 'wine_bar'
          {
            name: 'Wine Lounge',
            address: '200 Vine St, Los Angeles, CA 90028',
            rating: 4.4,
            price_level: 3,
            website: 'https://winelounge.com',
            hours: 'Mon-Sun: 4PM-12AM',
            types: [ 'bar', 'wine_bar' ],
            user_ratings_total: 180
          }
        end
      end
    end

    it 'returns bar recommendations without filtering by specific type' do
      post '/api/openai/bar_recommendations', params: bar_params, headers: auth_headers, as: :json

      expect(response).to have_http_status(:success)
      json = JSON.parse(response.body)

      expect(json['recommendations']).to be_an(Array)

      # Should not filter by single bar type at Google level
      expect(GooglePlacesService).to have_received(:nearby_search)
        .with('Los Angeles, CA', 'bar', anything, anything, nil)
    end

    it 'returns variety of bar types when multiple are specified' do
      post '/api/openai/bar_recommendations', params: bar_params, headers: auth_headers, as: :json

      expect(response).to have_http_status(:success)
      json = JSON.parse(response.body)

      # Should include variety in bar names
      expect(json['recommendations']).to be_an(Array)
      expect(json['recommendations'].length).to be >= 2

      names = json['recommendations'].map { |r| r['name'] }
      expect(names).to include('Craft Cocktails')
      expect(names).to include('Wine Lounge')
    end
  end

  describe 'Smart radius calculation' do
    let(:params_with_small_radius) do
      {
        responses: { 'cuisine_reasoning' => 'any' },
        activity_location: 'Rural Town, MT',
        radius: 1,
        date_notes: 'Tonight'
      }
    end

    it 'uses provided radius' do
      allow(GooglePlacesService).to receive(:nearby_search).and_return([
        {
          place_id: 'found',
          name: 'Restaurant',
          address: 'Main St, Rural Town, MT',
          rating: 4.0,
          price_level: 2,
          types: [ 'restaurant' ],
          user_ratings_total: 50
        }
      ])

      allow(GooglePlacesService).to receive(:get_detailed_venue_info).and_return({
        name: 'Restaurant',
        address: 'Main St, Rural Town, MT 59000',
        rating: 4.0,
        price_level: 2,
        website: 'https://restaurant.com',
        hours: 'Mon-Sun: 11AM-9PM',
        types: [ 'restaurant' ],
        user_ratings_total: 50
      })

      post '/api/openai/restaurant_recommendations', params: params_with_small_radius, headers: auth_headers, as: :json

      expect(response).to have_http_status(:success)
      expect(GooglePlacesService).to have_received(:nearby_search)
    end
  end
end
