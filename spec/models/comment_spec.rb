require 'rails_helper'

RSpec.describe Comment, type: :model do
  let(:comment) { build(:comment) }

  describe 'validations' do
    it 'is valid with valid attributes' do
      expect(comment).to be_valid
    end

    it 'requires content' do
      comment.content = nil
      expect(comment).not_to be_valid
      expect(comment.errors[:content]).to be_present
    end

    it 'requires a user' do
      comment.user = nil
      expect(comment).not_to be_valid
    end

    it 'allows comments with just activity' do
      comment.activity = create(:activity)
      comment.pinned_activity = nil
      expect(comment).to be_valid
    end

    it 'allows comments with just pinned_activity' do
      comment.activity = nil
      comment.pinned_activity = create(:pinned_activity)
      expect(comment).to be_valid
    end
  end

  describe 'associations' do
    it { should belong_to(:user) }
    it { should belong_to(:activity).optional }
    it { should belong_to(:pinned_activity).optional }
  end

  describe 'comment types' do
    let(:activity) { create(:activity) }
    let(:pinned_activity) { create(:pinned_activity) }
    let(:user) { create(:user) }

    it 'can be a comment on an activity' do
      comment = Comment.create!(
        user: user,
        activity: activity,
        content: 'This looks great!'
      )
      
      expect(comment.activity).to eq(activity)
      expect(comment.pinned_activity).to be_nil
    end

    it 'can be a comment on a pinned activity (venue)' do
      comment = Comment.create!(
        user: user,
        pinned_activity: pinned_activity,
        activity: pinned_activity.activity,
        content: 'I love this place!'
      )
      
      expect(comment.pinned_activity).to eq(pinned_activity)
      expect(comment.activity).to eq(pinned_activity.activity)
    end
  end

  describe 'content validation' do
    it 'accepts various content types' do
      valid_contents = [
        'Short comment',
        'A much longer comment with multiple sentences and details about the activity.',
        'Comment with emojis! 🎉 😊',
        'Comment with numbers 123 and symbols @#$'
      ]

      valid_contents.each do |content|
        comment.content = content
        expect(comment).to be_valid, "Content '#{content}' should be valid"
      end
    end

    it 'rejects empty content' do
      ['', '   ', nil].each do |empty_content|
        comment.content = empty_content
        expect(comment).not_to be_valid
      end
    end
  end

  describe 'user interactions' do
    let(:activity) { create(:activity) }
    let(:host) { activity.user }
    let(:participant) { create(:user) }

    it 'allows activity host to comment' do
      comment = Comment.create!(
        user: host,
        activity: activity,
        content: 'Welcome everyone!'
      )
      
      expect(comment).to be_valid
      expect(comment.user).to eq(host)
    end

    it 'allows participants to comment' do
      # Create a participant
      activity.activity_participants.create!(
        user: participant,
        invited_email: participant.email,
        accepted: true
      )

      comment = Comment.create!(
        user: participant,
        activity: activity,
        content: 'Thanks for organizing!'
      )
      
      expect(comment).to be_valid
      expect(comment.user).to eq(participant)
    end
  end

  describe 'ordering and timestamps' do
    let(:activity) { create(:activity) }
    let(:user) { create(:user) }

    it 'orders comments by creation time' do
      first_comment = Comment.create!(
        user: user,
        activity: activity,
        content: 'First comment'
      )
      
      # Travel in time to ensure different timestamps
      Timecop.travel(1.minute.from_now) do
        second_comment = Comment.create!(
          user: user,
          activity: activity,
          content: 'Second comment'
        )
        
        comments = activity.comments.order(:created_at)
        expect(comments.first).to eq(first_comment)
        expect(comments.last).to eq(second_comment)
      end
    end
  end

  describe 'factory' do
    it 'has a valid factory' do
      expect(build(:comment)).to be_valid
    end

    it 'has valid traits' do
      expect(build(:comment, :on_pinned_activity)).to be_valid
      expect(build(:comment, :short)).to be_valid
      expect(build(:comment, :long)).to be_valid
    end
  end
end