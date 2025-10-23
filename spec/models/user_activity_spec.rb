require 'rails_helper'

RSpec.describe UserActivity, type: :model do
  let(:user) { create(:user) }
  let(:activity) { create(:activity, user: user) }
  let(:pinned_activity) { create(:pinned_activity, activity: activity) }

  describe 'associations' do
    it { should belong_to(:user) }
    it { should belong_to(:pinned_activity) }

    it 'is accessible from user' do
      user_activity = create(:user_activity, user: user, pinned_activity: pinned_activity)
      expect(user.user_activities).to include(user_activity)
    end

    it 'is accessible from pinned_activity' do
      user_activity = create(:user_activity, user: user, pinned_activity: pinned_activity)
      expect(pinned_activity.user_activities).to include(user_activity)
    end
  end

  describe 'validations' do
    it 'validates uniqueness of user_id scoped to pinned_activity_id' do
      create(:user_activity, user: user, pinned_activity: pinned_activity)
      duplicate = build(:user_activity, user: user, pinned_activity: pinned_activity)

      expect(duplicate).not_to be_valid
      expect(duplicate.errors[:user_id]).to include('has already interacted with this pinned activity')
    end

    it 'allows same user with different pinned_activities' do
      other_activity = create(:activity, user: user)
      other_pinned_activity = create(:pinned_activity, activity: other_activity)

      create(:user_activity, user: user, pinned_activity: pinned_activity)
      duplicate = build(:user_activity, user: user, pinned_activity: other_pinned_activity)

      expect(duplicate).to be_valid
    end
  end

  describe 'JSON serialization' do
    let(:user_activity) { create(:user_activity, user: user, pinned_activity: pinned_activity) }

    it 'initializes reviews and photos as empty arrays' do
      expect(user_activity.reviews).to eq([])
      expect(user_activity.photos).to eq([])
    end

    it 'can store and retrieve review data' do
      review_data = [ { "author" => "John", "rating" => 5, "text" => "Great place!" } ]
      user_activity.update!(reviews: review_data)
      user_activity.reload

      expect(user_activity.reviews).to eq(review_data)
    end

    it 'can store and retrieve photo data' do
      photo_data = [ { "photo_reference" => "abc123", "height" => 400, "width" => 600 } ]
      user_activity.update!(photos: photo_data)
      user_activity.reload

      expect(user_activity.photos).to eq(photo_data)
    end
  end

  describe 'scopes' do
    let!(:flagged_activity) { create(:user_activity, :flagged, user: user, pinned_activity: pinned_activity) }
    let!(:favorited_activity) { create(:user_activity, :favorited, user: user, pinned_activity: create(:pinned_activity, activity: create(:activity, user: user))) }
    let!(:normal_activity) { create(:user_activity, user: user, pinned_activity: create(:pinned_activity, activity: create(:activity, user: user))) }

    describe '.flagged' do
      it 'returns only flagged activities' do
        expect(UserActivity.flagged).to contain_exactly(flagged_activity)
      end
    end

    describe '.favorited' do
      it 'returns only favorited activities' do
        expect(UserActivity.favorited).to contain_exactly(favorited_activity)
      end
    end

    describe '.by_user' do
      let(:other_user) { create(:user) }
      let!(:other_user_activity) { create(:user_activity, user: other_user, pinned_activity: create(:pinned_activity, activity: create(:activity, user: other_user))) }

      it 'returns only activities for the specified user' do
        expect(UserActivity.by_user(user)).to contain_exactly(flagged_activity, favorited_activity, normal_activity)
        expect(UserActivity.by_user(other_user)).to contain_exactly(other_user_activity)
      end
    end
  end

  describe 'instance methods' do
    let(:user_activity) { create(:user_activity, user: user, pinned_activity: pinned_activity) }

    describe 'flagging methods' do
      describe '#flag!' do
        it 'sets flagged to true' do
          expect { user_activity.flag! }.to change { user_activity.flagged }.from(false).to(true)
        end
      end

      describe '#unflag!' do
        it 'sets flagged to false' do
          user_activity.update!(flagged: true)
          expect { user_activity.unflag! }.to change { user_activity.flagged }.from(true).to(false)
        end
      end

      describe '#toggle_flag!' do
        it 'toggles flagged status' do
          expect { user_activity.toggle_flag! }.to change { user_activity.flagged }.from(false).to(true)
          expect { user_activity.toggle_flag! }.to change { user_activity.flagged }.from(true).to(false)
        end
      end
    end

    describe 'favoriting methods' do
      describe '#favorite!' do
        it 'sets favorited to true' do
          expect { user_activity.favorite! }.to change { user_activity.favorited }.from(false).to(true)
        end
      end

      describe '#unfavorite!' do
        it 'sets favorited to false' do
          user_activity.update!(favorited: true)
          expect { user_activity.unfavorite! }.to change { user_activity.favorited }.from(true).to(false)
        end
      end

      describe '#toggle_favorite!' do
        it 'toggles favorited status' do
          expect { user_activity.toggle_favorite! }.to change { user_activity.favorited }.from(false).to(true)
          expect { user_activity.toggle_favorite! }.to change { user_activity.favorited }.from(true).to(false)
        end
      end
    end

    describe '#copy_from_pinned_activity' do
      let(:pinned_activity_with_data) do
        create(:pinned_activity, :with_reviews, :with_photos,
               activity: activity,
               title: "Test Restaurant",
               hours: "9 AM - 11 PM",
               price_range: "$$$",
               address: "123 Test St",
               description: "Great food",
               reason: "Highly recommended",
               website: "https://test.com")
      end
      let(:user_activity) { create(:user_activity, user: user, pinned_activity: pinned_activity_with_data) }

      before do
        # Stub GooglePlacesService to avoid external API calls
        allow(GooglePlacesService).to receive(:enrich_place_data).and_return({
          photos: [],
          reviews: []
        })
      end

      it 'copies all fields from pinned_activity' do
        # Clear the data first
        user_activity.update!(
          title: nil, hours: nil, price_range: nil, address: nil,
          description: nil, reason: nil, website: nil, reviews: [], photos: []
        )

        user_activity.copy_from_pinned_activity

        expect(user_activity.title).to eq(pinned_activity_with_data.title)
        expect(user_activity.hours).to eq(pinned_activity_with_data.hours)
        expect(user_activity.price_range).to eq(pinned_activity_with_data.price_range)
        expect(user_activity.address).to eq(pinned_activity_with_data.address)
        expect(user_activity.description).to eq(pinned_activity_with_data.description)
        expect(user_activity.reason).to eq(pinned_activity_with_data.reason)
        expect(user_activity.website).to eq(pinned_activity_with_data.website)
        expect(user_activity.reviews).to eq(pinned_activity_with_data.reviews)
        expect(user_activity.photos).to eq(pinned_activity_with_data.photos)
      end
    end

    describe '#sync_with_pinned_activity!' do
      let(:pinned_activity_with_data) do
        create(:pinned_activity,
               activity: activity,
               title: "Updated Restaurant")
      end
      let(:user_activity) { create(:user_activity, user: user, pinned_activity: pinned_activity_with_data, title: "Old Name") }

      before do
        # Stub GooglePlacesService to avoid external API calls
        allow(GooglePlacesService).to receive(:enrich_place_data).and_return({
          photos: [],
          reviews: []
        })
      end

      it 'updates and saves data from pinned_activity' do
        pinned_activity_with_data.update!(title: "New Restaurant Name")
        user_activity.sync_with_pinned_activity!

        expect(user_activity.reload.title).to eq("New Restaurant Name")
      end
    end
  end

  describe 'class methods' do
    describe '.find_or_create_for_user_and_pinned_activity' do
      before do
        # Stub GooglePlacesService to avoid external API calls
        allow(GooglePlacesService).to receive(:enrich_place_data).and_return({
          photos: [],
          reviews: []
        })
      end

      it 'creates a new user_activity if none exists' do
        expect {
          UserActivity.find_or_create_for_user_and_pinned_activity(user, pinned_activity)
        }.to change(UserActivity, :count).by(1)
      end

      it 'returns existing user_activity if one exists' do
        existing = create(:user_activity, user: user, pinned_activity: pinned_activity)

        result = UserActivity.find_or_create_for_user_and_pinned_activity(user, pinned_activity)

        expect(result).to eq(existing)
        expect(UserActivity.count).to eq(1)
      end

      it 'copies data from pinned_activity when creating new record' do
        pinned_activity.update!(title: "Test Restaurant", price_range: "$$$")

        user_activity = UserActivity.find_or_create_for_user_and_pinned_activity(user, pinned_activity)

        expect(user_activity.title).to eq("Test Restaurant")
        expect(user_activity.price_range).to eq("$$$")
      end
    end
  end
end
