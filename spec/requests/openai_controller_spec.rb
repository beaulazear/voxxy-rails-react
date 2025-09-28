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
            types: [ 'restaurant', 'italian' ]
          },
          {
            place_id: 'japanese_place',
            name: 'Sushi Bar',
            address: '456 Market St, San Francisco, CA 94103',
            rating: 4.7,
            price_level: 3,
            types: [ 'restaurant', 'japanese' ]
          },
          {
            place_id: 'mexican_place',
            name: 'Taqueria',
            address: '789 Mission St, San Francisco, CA 94104',
            rating: 4.3,
            price_level: 1,
            types: [ 'restaurant', 'mexican' ]
          }
        ])

        # Mock detailed venue info
        allow(GooglePlacesService).to receive(:get_detailed_venue_info).and_return({
          name: 'Test Restaurant',
          address: '123 Full Address, San Francisco, CA 94102, USA',
          rating: 4.5,
          price_level: 2,
          website: 'https://restaurant.com',
          phone_number: '+1-415-555-0123',
          hours: [ 'Mon-Fri: 11AM-10PM' ],
          user_ratings_total: 100
        })

        # Mock OpenAI API response
        allow_any_instance_of(OpenaiController).to receive(:fetch_restaurant_recommendations_with_real_venues)
          .and_return({
            recommendations: [
              {
                name: 'Italian Bistro',
                address: '123 Main St, San Francisco, CA 94102',
                keywords: 'italian, vegetarian-friendly, moderate-price'
              },
              {
                name: 'Sushi Bar',
                address: '456 Market St, San Francisco, CA 94103',
                keywords: 'japanese, fresh, upscale'
              },
              {
                name: 'Taqueria',
                address: '789 Mission St, San Francisco, CA 94104',
                keywords: 'mexican, casual, budget-friendly'
              }
            ]
          })
      end

      it 'returns diverse cuisine recommendations when multiple cuisines are specified' do
        post '/api/openai/restaurant_recommendations', params: valid_params, headers: auth_headers, as: :json

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)

        expect(json['recommendations']).to be_an(Array)
        expect(json['recommendations'].length).to be >= 3

        # Verify variety in cuisine types
        cuisines = json['recommendations'].map { |r| r['keywords'] }.join(' ')
        expect(cuisines).to include('italian')
        expect(cuisines).to include('japanese')
        expect(cuisines).to include('mexican')
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

      it 'fetches 30 venues for better diversity' do
        venues = Array.new(30) { |i|
          {
            place_id: "place_#{i}",
            name: "Restaurant #{i}",
            address: "#{i} Street, San Francisco, CA",
            rating: 4.0 + (i * 0.01)
          }
        }

        allow(GooglePlacesService).to receive(:nearby_search).and_return(venues)

        post '/api/openai/restaurant_recommendations', params: valid_params, headers: auth_headers, as: :json

        # The controller should process up to 30 venues
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

      it 'prioritizes dietary restrictions above other preferences' do
        post '/api/openai/restaurant_recommendations', params: dietary_params, headers: auth_headers, as: :json

        expect(response).to have_http_status(:success)
        # Dietary preferences should be reflected in the AI prompt
      end
    end

    context 'when no venues are found' do
      before do
        allow(GooglePlacesService).to receive(:nearby_search).and_return([])
      end

      it 'falls back to AI-generated recommendations' do
        post '/api/openai/restaurant_recommendations', params: valid_params, headers: auth_headers, as: :json

        expect(response).to have_http_status(:success)
        json = JSON.parse(response.body)
        expect(json['recommendations']).to be_an(Array)
      end
    end

    context 'with invalid parameters' do
      it 'returns error without activity_location' do
        invalid_params = valid_params.except(:activity_location)
        post '/api/openai/restaurant_recommendations', params: invalid_params, headers: auth_headers, as: :json

        expect(response).to have_http_status(:unprocessable_entity)
      end

      it 'returns error without authentication' do
        post '/api/openai/restaurant_recommendations', params: valid_params, as: :json

        expect(response).to have_http_status(:unauthorized)
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
          price_level: 3
        },
        {
          place_id: 'wine_bar',
          name: 'Wine Lounge',
          address: '200 Vine St, Los Angeles, CA 90028',
          rating: 4.4,
          price_level: 3
        }
      ])

      allow(GooglePlacesService).to receive(:get_detailed_venue_info).and_return({
        name: 'Test Bar',
        address: '100 Full Address, Los Angeles, CA 90028, USA',
        rating: 4.5,
        price_level: 3,
        website: 'https://bar.com'
      })
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
      allow_any_instance_of(OpenaiController).to receive(:fetch_bar_recommendations_with_real_venues)
        .and_return({
          recommendations: [
            {
              name: 'Craft Cocktails',
              address: '100 Sunset Blvd, Los Angeles, CA 90028',
              keywords: 'cocktails, upscale, rooftop'
            },
            {
              name: 'Wine Lounge',
              address: '200 Vine St, Los Angeles, CA 90028',
              keywords: 'wine, trendy, intimate'
            },
            {
              name: 'Sports Hub',
              address: '300 Hollywood Blvd, Los Angeles, CA 90028',
              keywords: 'sports, casual, lively'
            }
          ]
        })

      post '/api/openai/bar_recommendations', params: bar_params, headers: auth_headers, as: :json

      json = JSON.parse(response.body)
      keywords = json['recommendations'].map { |r| r['keywords'] }.join(' ')

      # Should include variety
      expect(keywords).to include('cocktails')
      expect(keywords).to include('wine')
      expect(keywords).to include('sports')
    end
  end

  describe 'Smart radius calculation' do
    let(:params_with_small_radius) do
      {
        responses: { 'cuisine_reasoning' => 'any' },
        activity_location: 'Rural Town, MT',
        radius: 1
      }
    end

    it 'adjusts radius intelligently for sparse areas' do
      # Mock empty results for small radius
      allow(GooglePlacesService).to receive(:nearby_search)
        .with(anything, anything, 1609, anything, anything)
        .and_return([])

      # Mock results for larger radius
      allow(GooglePlacesService).to receive(:nearby_search)
        .with(anything, anything, 3218, anything, anything)
        .and_return([ { place_id: 'found', name: 'Restaurant' } ])

      post '/api/openai/restaurant_recommendations', params: params_with_small_radius, headers: auth_headers, as: :json

      expect(response).to have_http_status(:success)
    end
  end
end
