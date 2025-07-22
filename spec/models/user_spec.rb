require 'rails_helper'

RSpec.describe User, type: :model do
  describe 'validations' do
    subject { build(:user) }

    it { should validate_presence_of(:name) }
    it { should validate_presence_of(:email) }
    it { should validate_uniqueness_of(:email) }
    it { should validate_presence_of(:password) }
    it { should validate_length_of(:password).is_at_least(6) }
    it { should validate_presence_of(:password_confirmation) }

    it 'validates email format' do
      user = build(:user, email: 'invalid-email')
      expect(user).not_to be_valid
      expect(user.errors[:email]).to include('is invalid')
    end
  end

  describe 'associations' do
    it { should have_many(:activities).dependent(:destroy) }
    it { should have_many(:activity_participants).dependent(:destroy) }
    it { should have_many(:joined_activities).through(:activity_participants) }
    it { should have_many(:comments).dependent(:destroy) }
    it { should have_many(:votes).dependent(:destroy) }
  end

  describe 'secure password' do
    it { should have_secure_password }
  end

  describe 'callbacks' do
    describe 'before_create' do
      it 'generates confirmation token for unconfirmed users' do
        user = build(:user, confirmed_at: nil)
        expect(user.confirmation_token).to be_nil
        user.save
        expect(user.confirmation_token).to be_present
      end

      it 'does not generate confirmation token for confirmed users' do
        user = build(:user, confirmed_at: Time.current)
        user.save
        expect(user.confirmation_token).to be_nil
      end
    end

    describe 'notification defaults' do
      it 'sets default notification preferences' do
        user = User.new(
          name: 'Test User',
          email: 'test@example.com',
          password: 'password123',
          password_confirmation: 'password123'
        )
        user.save
        expect(user.text_notifications).to be true
        expect(user.email_notifications).to be true
        expect(user.push_notifications).to be true
        expect(user.preferences).to eq("")
      end
    end
  end

  describe 'instance methods' do
    describe '#verify!' do
      it 'confirms the user and clears confirmation token' do
        user = create(:user, :unconfirmed)
        expect(user.confirmed_at).to be_nil
        expect(user.confirmation_token).to be_present

        user.verify!

        expect(user.confirmed_at).to be_present
        expect(user.confirmation_token).to be_nil
      end
    end

    describe '#generate_password_reset_token' do
      it 'generates a reset token and sets timestamp' do
        user = create(:user)
        expect(user.reset_password_token).to be_nil

        user.generate_password_reset_token

        expect(user.reset_password_token).to be_present
        expect(user.reset_password_sent_at).to be_present
      end
    end

    describe '#password_reset_token_valid?' do
      it 'returns true if token was sent within 24 hours' do
        user = create(:user)
        user.update(reset_password_sent_at: 23.hours.ago)
        expect(user.password_reset_token_valid?).to be true
      end

      it 'returns false if token was sent more than 24 hours ago' do
        user = create(:user)
        user.update(reset_password_sent_at: 25.hours.ago)
        expect(user.password_reset_token_valid?).to be false
      end
    end

    describe '#reset_password!' do
      it 'updates password and clears reset token' do
        user = create(:user)
        user.generate_password_reset_token

        user.reset_password!('newpassword123')

        expect(user.authenticate('newpassword123')).to eq(user)
        expect(user.reset_password_token).to be_nil
        expect(user.reset_password_sent_at).to be_nil
      end
    end

    describe '#can_receive_push_notifications?' do
      it 'returns true when push notifications enabled and token present' do
        user = create(:user, push_notifications: true, push_token: 'token123')
        expect(user.can_receive_push_notifications?).to be true
      end

      it 'returns false when push notifications disabled' do
        user = create(:user, push_notifications: false, push_token: 'token123')
        expect(user.can_receive_push_notifications?).to be false
      end

      it 'returns false when push token is missing' do
        user = create(:user, push_notifications: true, push_token: nil)
        expect(user.can_receive_push_notifications?).to be false
      end
    end

    describe '#profile_pic_url' do
      it 'returns nil when no profile pic attached' do
        user = create(:user)
        expect(user.profile_pic_url).to be_nil
      end
    end

    describe '#display_image_url' do
      it 'returns avatar when no profile pic attached' do
        user = create(:user, :with_avatar)
        expect(user.display_image_url).to eq(user.avatar)
      end

      it 'returns profile_pic_url when available' do
        user = create(:user)
        allow(user).to receive(:profile_pic_url).and_return('/some/url')
        expect(user.display_image_url).to eq('/some/url')
      end
    end
  end
end
