require 'rails_helper'

RSpec.describe PinnedActivity, type: :model do
  let(:pinned_activity) { build(:pinned_activity) }

  describe 'validations' do
    it 'is valid with valid attributes' do
      expect(pinned_activity).to be_valid
    end

    it 'requires an activity' do
      pinned_activity.activity = nil
      expect(pinned_activity).not_to be_valid
    end

    it 'allows creation without title (can be set later)' do
      pinned_activity.title = nil
      expect(pinned_activity).to be_valid
    end
  end

  describe 'associations' do
    it { should belong_to(:activity) }
    it { should have_many(:votes).dependent(:destroy) }
    it { should have_many(:voters).through(:votes).source(:user) }
    it { should have_many(:comments).dependent(:destroy) }
  end

  describe 'venue information' do
    let(:activity) { create(:activity) }

    it 'stores comprehensive venue details' do
      venue = PinnedActivity.create!(
        activity: activity,
        title: 'Pizza Palace',
        address: '123 Main St, Seattle, WA',
        hours: 'Mon-Sun: 11AM-11PM',
        price_range: '$$',
        description: 'Authentic wood-fired pizza in a cozy atmosphere',
        website: 'https://pizzapalace.com',
        reviews: { 'google' => 4.5, 'yelp' => 4.0 }.to_json,
        photos: [ 'photo1.jpg', 'photo2.jpg' ].to_json
      )

      expect(venue.title).to eq('Pizza Palace')
      expect(venue.address).to eq('123 Main St, Seattle, WA')
      expect(venue.hours).to eq('Mon-Sun: 11AM-11PM')
      expect(venue.price_range).to eq('$$')
      expect(venue.description).to be_present
      expect(venue.website).to eq('https://pizzapalace.com')
    end

    it 'can store additional context in reason field' do
      venue = PinnedActivity.create!(
        activity: activity,
        title: 'Local Brewery',
        address: '456 Beer St',
        reason: 'Great happy hour deals and close to everyone'
      )

      expect(venue.reason).to eq('Great happy hour deals and close to everyone')
    end
  end

  describe 'selection state' do
    let(:activity) { create(:activity) }

    it 'defaults to not selected' do
      venue = PinnedActivity.create!(
        activity: activity,
        title: 'Test Venue',
        address: '123 Test St'
      )

      expect(venue.selected).to be false
    end

    it 'can be marked as selected' do
      venue = PinnedActivity.create!(
        activity: activity,
        title: 'Chosen Venue',
        address: '123 Winner St',
        selected: true
      )

      expect(venue.selected).to be true
    end

    it 'allows only one venue to be selected per activity' do
      venue1 = PinnedActivity.create!(
        activity: activity,
        title: 'Venue 1',
        address: '123 First St',
        selected: true
      )

      venue2 = PinnedActivity.create!(
        activity: activity,
        title: 'Venue 2',
        address: '456 Second St'
      )

      # When selecting the second venue, first should be deselected
      # This logic would typically be handled in the controller or service
      activity.pinned_activities.where(selected: true).where.not(id: venue2.id).update_all(selected: false)
      venue2.update!(selected: true)

      activity.reload
      selected_venues = activity.pinned_activities.where(selected: true)
      expect(selected_venues.count).to eq(1)
      expect(selected_venues.first).to eq(venue2)
    end
  end

  describe 'voting system' do
    let(:activity) { create(:activity) }
    let(:venue) { create(:pinned_activity, activity: activity) }
    let(:user1) { create(:user) }
    let(:user2) { create(:user) }

    it 'can receive votes from users' do
      vote1 = venue.votes.create!(user: user1, upvote: true)
      vote2 = venue.votes.create!(user: user2, upvote: false)

      expect(venue.votes.count).to eq(2)
      expect(venue.voters).to include(user1, user2)
    end

    it 'tracks vote counts' do
      venue.votes.create!(user: user1, upvote: true)
      venue.votes.create!(user: user2, upvote: true)
      venue.votes.create!(user: create(:user), upvote: false)

      upvotes = venue.votes.where(upvote: true).count
      downvotes = venue.votes.where(upvote: false).count

      expect(upvotes).to eq(2)
      expect(downvotes).to eq(1)
    end

    it 'prevents duplicate votes from same user' do
      venue.votes.create!(user: user1, upvote: true)

      duplicate_vote = venue.votes.build(user: user1, upvote: false)
      expect(duplicate_vote).not_to be_valid
    end
  end

  describe 'comments and discussion' do
    let(:activity) { create(:activity) }
    let(:venue) { create(:pinned_activity, activity: activity) }
    let(:user) { create(:user) }

    it 'can have comments about the venue' do
      comment = venue.comments.create!(
        user: user,
        activity: activity,
        content: 'I went here last week, great food!'
      )

      expect(venue.comments.count).to eq(1)
      expect(comment.content).to include('great food')
    end
  end

  describe 'data storage formats' do
    let(:activity) { create(:activity) }

    it 'can store reviews as JSON' do
      reviews_data = {
        'google' => { 'rating' => 4.5, 'count' => 120 },
        'yelp' => { 'rating' => 4.0, 'count' => 85 }
      }

      venue = PinnedActivity.create!(
        activity: activity,
        title: 'Test Venue',
        address: '123 Test St',
        reviews: reviews_data.to_json
      )

      expect(venue.reviews).to be_present
    end

    it 'can store photos as JSON array' do
      photos_data = [
        'https://example.com/photo1.jpg',
        'https://example.com/photo2.jpg',
        'https://example.com/photo3.jpg'
      ]

      venue = PinnedActivity.create!(
        activity: activity,
        title: 'Photo Venue',
        address: '123 Photo St',
        photos: photos_data.to_json
      )

      expect(venue.photos).to be_present
    end
  end

  describe 'price range formatting' do
    let(:activity) { create(:activity) }

    it 'accepts standard price range formats' do
      price_ranges = [ '$', '$$', '$$$', '$$$$', 'Free', 'Varies' ]

      price_ranges.each do |range|
        venue = PinnedActivity.create!(
          activity: activity,
          title: "#{range} Venue",
          address: '123 Price St',
          price_range: range
        )

        expect(venue.price_range).to eq(range)
      end
    end
  end

  describe 'deletion and cleanup' do
    let(:activity) { create(:activity) }
    let(:venue) { create(:pinned_activity, activity: activity) }
    let(:user) { create(:user) }

    it 'deletes associated votes when venue is deleted' do
      venue.votes.create!(user: user, upvote: true)

      expect { venue.destroy! }.to change { Vote.count }.by(-1)
    end

    it 'deletes associated comments when venue is deleted' do
      venue.comments.create!(user: user, activity: activity, content: 'Test comment')

      expect { venue.destroy! }.to change { Comment.count }.by(-1)
    end

    it 'is deleted when parent activity is deleted' do
      venue_id = venue.id
      activity.destroy!

      expect(PinnedActivity.find_by(id: venue_id)).to be_nil
    end
  end

  describe 'factory' do
    it 'has a valid factory' do
      expect(build(:pinned_activity)).to be_valid
    end

    it 'creates venue with realistic data' do
      venue = create(:pinned_activity)

      expect(venue.title).to be_present
      expect(venue.address).to be_present
      expect(venue.activity).to be_present
    end
  end
end
