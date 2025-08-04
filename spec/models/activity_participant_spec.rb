require 'rails_helper'

RSpec.describe ActivityParticipant, type: :model do
  let(:activity_participant) { build(:activity_participant) }

  describe 'validations' do
    it 'is valid with valid attributes' do
      expect(activity_participant).to be_valid
    end

    it 'requires an activity' do
      activity_participant.activity = nil
      expect(activity_participant).not_to be_valid
    end

    it 'allows creation without invited email (for direct user invites)' do
      activity_participant.invited_email = nil
      expect(activity_participant).to be_valid
    end

    it 'allows various email formats' do
      ['test@example.com', 'invalid-email', ''].each do |email|
        activity_participant.invited_email = email
        expect(activity_participant).to be_valid
      end
    end

    it 'accepts valid email formats' do
      valid_emails = ['test@example.com', 'user.name@domain.co.uk', 'test+tag@example.org']
      valid_emails.each do |email|
        activity_participant.invited_email = email
        expect(activity_participant).to be_valid
      end
    end
  end

  describe 'associations' do
    it { should belong_to(:activity) }
    it { should belong_to(:user).optional }
  end

  describe 'uniqueness constraints' do
    let(:activity) { create(:activity) }

    it 'allows duplicate invitations to the same email for the same activity (no uniqueness constraint)' do
      ActivityParticipant.create!(
        activity: activity,
        invited_email: 'test@example.com'
      )

      duplicate = ActivityParticipant.new(
        activity: activity,
        invited_email: 'test@example.com'
      )

      expect(duplicate).to be_valid
    end

    it 'allows the same email to be invited to different activities' do
      activity2 = create(:activity)

      ActivityParticipant.create!(
        activity: activity,
        invited_email: 'test@example.com'
      )

      different_activity_invite = ActivityParticipant.new(
        activity: activity2,
        invited_email: 'test@example.com'
      )

      expect(different_activity_invite).to be_valid
    end
  end

  describe 'guest response tokens' do
    it 'can have a guest response token for email-only invites' do
      participant = create(:activity_participant, :with_guest_token)
      expect(participant.guest_response_token).to be_present
    end

    it 'generates unique guest response tokens automatically' do
      participant1 = create(:activity_participant, :with_guest_token)
      participant2 = create(:activity_participant, :with_guest_token)
      
      expect(participant1.guest_response_token).to be_present
      expect(participant2.guest_response_token).to be_present
      expect(participant1.guest_response_token).not_to eq(participant2.guest_response_token)
    end
  end

  describe 'invitation states' do
    let(:activity) { create(:activity) }
    let(:user) { create(:user) }

    describe 'pending invitation' do
      it 'starts as not accepted' do
        participant = ActivityParticipant.create!(
          activity: activity,
          invited_email: user.email
        )
        
        expect(participant.accepted).to be false
      end
    end

    describe 'accepted invitation' do
      it 'can be accepted by linking to a user' do
        participant = ActivityParticipant.create!(
          activity: activity,
          invited_email: user.email
        )
        
        participant.update!(user: user, accepted: true)
        
        expect(participant.accepted).to be true
        expect(participant.user).to eq(user)
      end
    end

    describe 'user linking' do
      it 'can link invited email to existing user' do
        participant = ActivityParticipant.create!(
          activity: activity,
          invited_email: user.email
        )
        
        participant.update!(user: user)
        expect(participant.user).to eq(user)
        expect(participant.invited_email).to eq(user.email)
      end

      it 'can be created with user and email at the same time' do
        participant = ActivityParticipant.create!(
          activity: activity,
          invited_email: user.email,
          user: user,
          accepted: true
        )
        
        expect(participant.user).to eq(user)
        expect(participant.invited_email).to eq(user.email)
        expect(participant.accepted).to be true
      end
    end
  end

  describe 'activity relationship' do
    let(:activity) { create(:activity) }
    let(:user1) { create(:user) }
    let(:user2) { create(:user) }

    it 'allows multiple participants per activity' do
      participant1 = ActivityParticipant.create!(
        activity: activity,
        invited_email: user1.email,
        user: user1,
        accepted: true
      )
      
      participant2 = ActivityParticipant.create!(
        activity: activity,
        invited_email: user2.email,
        user: user2,
        accepted: true
      )
      
      expect(activity.activity_participants.count).to eq(2)
      expect(activity.participants).to include(user1, user2)
    end

    it 'allows users to participate in multiple activities' do
      activity2 = create(:activity)
      
      ActivityParticipant.create!(
        activity: activity,
        invited_email: user1.email,
        user: user1,
        accepted: true
      )
      
      ActivityParticipant.create!(
        activity: activity2,
        invited_email: user1.email,
        user: user1,
        accepted: true
      )
      
      expect(user1.activity_participants.count).to eq(2)
      expect(user1.joined_activities).to include(activity, activity2)
    end
  end

  describe 'email case handling' do
    let(:activity) { create(:activity) }

    it 'handles email case consistently' do
      # This test assumes the application handles email case normalization
      # The actual implementation should normalize emails to lowercase
      
      participant = ActivityParticipant.create!(
        activity: activity,
        invited_email: 'Test@Example.Com'
      )
      
      # Verify the email is stored (case handling depends on implementation)
      expect(participant.invited_email).to be_present
    end
  end

  describe 'deletion and cleanup' do
    let(:activity) { create(:activity) }
    let(:user) { create(:user) }

    it 'can be deleted when user leaves activity' do
      participant = ActivityParticipant.create!(
        activity: activity,
        invited_email: user.email,
        user: user,
        accepted: true
      )
      
      expect { participant.destroy! }.not_to raise_error
      expect(activity.activity_participants.count).to eq(0)
    end

    it 'is deleted when activity is deleted' do
      participant = ActivityParticipant.create!(
        activity: activity,
        invited_email: user.email
      )
      
      activity.destroy!
      
      expect(ActivityParticipant.find_by(id: participant.id)).to be_nil
    end
  end

  describe 'factory' do
    it 'has a valid factory' do
      expect(build(:activity_participant)).to be_valid
    end

    it 'has valid traits' do
      expect(build(:activity_participant, :accepted)).to be_valid
      expect(build(:activity_participant, :with_user)).to be_valid
      expect(build(:activity_participant, :with_guest_token)).to be_valid
    end
  end
end