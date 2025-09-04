require 'rails_helper'

RSpec.describe ModerationAction, type: :model do
  let(:user) { create(:user) }
  let(:moderator) { create(:user, admin: true) }
  let(:report) { create(:report) }

  describe 'associations' do
    it { should belong_to(:user) }
    it { should belong_to(:moderator).class_name("User") }
    it { should belong_to(:report).optional }
  end

  describe 'validations' do
    it { should validate_presence_of(:action_type) }
    it { should validate_inclusion_of(:action_type).in_array(%w[warned suspended banned unbanned content_removed appeal_approved appeal_rejected]) }
  end

  describe 'scopes' do
    let!(:warning) { create(:moderation_action, action_type: 'warned') }
    let!(:suspension) { create(:moderation_action, action_type: 'suspended', expires_at: 7.days.from_now) }
    let!(:ban) { create(:moderation_action, action_type: 'banned') }
    let!(:expired_suspension) { create(:moderation_action, action_type: 'suspended', expires_at: 1.day.ago) }

    describe '.warnings' do
      it 'returns only warning actions' do
        expect(ModerationAction.warnings).to contain_exactly(warning)
      end
    end

    describe '.suspensions' do
      it 'returns only suspension actions' do
        expect(ModerationAction.suspensions).to contain_exactly(suspension, expired_suspension)
      end
    end

    describe '.bans' do
      it 'returns only ban actions' do
        expect(ModerationAction.bans).to contain_exactly(ban)
      end
    end

    describe '.active' do
      it 'returns only active actions' do
        expect(ModerationAction.active).to contain_exactly(warning, suspension, ban)
      end
    end

    describe '.recent' do
      it 'orders actions by most recent first' do
        expect(ModerationAction.recent.first).to eq(expired_suspension)
      end
    end
  end

  describe 'callbacks' do
    context 'when action_type is warned' do
      it 'increments user warnings count' do
        expect {
          create(:moderation_action, user: user, moderator: moderator, action_type: 'warned')
        }.to change { user.reload.warnings_count }.by(1)
      end
    end

    context 'when creating any action' do
      it 'sends notification email' do
        service = instance_double(UserModerationEmailService)
        expect(UserModerationEmailService).to receive(:new).with(user, 'warned', nil).and_return(service)
        expect(service).to receive(:send_email)
        
        create(:moderation_action, user: user, moderator: moderator, action_type: 'warned')
      end
    end
  end

  describe '.log_action' do
    it 'creates a moderation action with all parameters' do
      action = ModerationAction.log_action(
        user: user,
        moderator: moderator,
        action: 'suspended',
        reason: 'Testing suspension',
        report: report,
        expires_at: 7.days.from_now
      )

      expect(action).to be_persisted
      expect(action.user).to eq(user)
      expect(action.moderator).to eq(moderator)
      expect(action.action_type).to eq('suspended')
      expect(action.reason).to eq('Testing suspension')
      expect(action.report).to eq(report)
      expect(action.expires_at).to be_present
    end
  end

  describe '#active?' do
    context 'when expires_at is nil' do
      let(:action) { create(:moderation_action, expires_at: nil) }
      
      it 'returns true' do
        expect(action.active?).to be true
      end
    end

    context 'when expires_at is in the future' do
      let(:action) { create(:moderation_action, expires_at: 1.day.from_now) }
      
      it 'returns true' do
        expect(action.active?).to be true
      end
    end

    context 'when expires_at is in the past' do
      let(:action) { create(:moderation_action, expires_at: 1.day.ago) }
      
      it 'returns false' do
        expect(action.active?).to be false
      end
    end
  end

  describe '#expired?' do
    context 'when expires_at is nil' do
      let(:action) { create(:moderation_action, expires_at: nil) }
      
      it 'returns false' do
        expect(action.expired?).to be false
      end
    end

    context 'when expires_at is in the future' do
      let(:action) { create(:moderation_action, expires_at: 1.day.from_now) }
      
      it 'returns false' do
        expect(action.expired?).to be false
      end
    end

    context 'when expires_at is in the past' do
      let(:action) { create(:moderation_action, expires_at: 1.day.ago) }
      
      it 'returns true' do
        expect(action.expired?).to be true
      end
    end
  end

  describe '#expires_in' do
    context 'when expires_at is nil' do
      let(:action) { create(:moderation_action, expires_at: nil) }
      
      it 'returns nil' do
        expect(action.expires_in).to be_nil
      end
    end

    context 'when expires_at is set' do
      let(:expires_time) { 7.days.from_now }
      let(:action) { create(:moderation_action, expires_at: expires_time) }
      
      it 'returns time remaining until expiration' do
        expect(action.expires_in).to be_within(1.second).of(expires_time - Time.current)
      end
    end
  end
end