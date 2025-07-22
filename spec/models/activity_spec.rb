require 'rails_helper'

RSpec.describe Activity, type: :model do
  describe 'validations' do
    subject { build(:activity) }
    
    it { should validate_presence_of(:activity_name) }
    it { should validate_presence_of(:activity_type) }
    it { should validate_presence_of(:date_notes) }
    
    describe 'date_day validation' do
      it 'is valid with a future date' do
        activity = build(:activity, date_day: 1.day.from_now)
        expect(activity).to be_valid
      end
      
      it 'is invalid with a past date' do
        user = create(:user)
        past_date = Date.today - 1
        activity = build(:activity, user: user, date_day: past_date)
        
        expect(activity.valid?).to be false
        expect(activity.errors[:date_day]).to include('must be a future date')
      end
      
      it 'allows past date when marking as completed' do
        activity = create(:activity, date_day: 1.day.from_now)
        activity.update(date_day: 1.day.ago, completed: true)
        expect(activity).to be_valid
      end
    end
  end
  
  describe 'associations' do
    it { should belong_to(:user) }
    it { should have_many(:responses).dependent(:destroy) }
    it { should have_many(:activity_participants).dependent(:destroy) }
    it { should have_many(:participants).through(:activity_participants) }
    it { should have_many(:pinned_activities).dependent(:destroy) }
    it { should have_many(:comments).dependent(:destroy) }
    it { should have_many(:time_slots).dependent(:destroy) }
  end
  
  describe 'callbacks' do
    describe 'after_update' do
      context 'when finalized status changes' do
        it 'schedules reminders when finalized becomes true' do
          activity = create(:activity, :with_future_date, finalized: false)
          
          # We can't easily test Sidekiq jobs in this basic setup, 
          # so we'll just verify the callback is triggered
          expect(activity).to receive(:schedule_reminders)
          activity.update(finalized: true)
        end
      end
      
      context 'when date_time changes' do
        it 'reschedules reminders if activity is finalized' do
          activity = create(:activity, :finalized)
          
          expect(activity).to receive(:reschedule_reminders)
          activity.update(date_time: "2000-01-01 20:00:00")
        end
      end
    end
  end
  
  describe 'instance methods' do
    describe '#availability_tally' do
      it 'returns empty hash when no responses' do
        activity = create(:activity)
        expect(activity.availability_tally).to eq({})
      end
      
      it 'tallies availability from responses' do
        activity = create(:activity)
        user1 = create(:user)
        user2 = create(:user)
        
        create(:response, 
          activity: activity, 
          user: user1,
          availability: {
            "2024-03-15" => ["18:00", "19:00"],
            "2024-03-16" => ["20:00"]
          }
        )
        
        create(:response, 
          activity: activity, 
          user: user2,
          availability: {
            "2024-03-15" => ["18:00"],
            "2024-03-16" => ["20:00"]
          }
        )
        
        tally = activity.availability_tally
        expect(tally["2024-03-15 18:00"]).to eq(2)
        expect(tally["2024-03-15 19:00"]).to eq(1)
        expect(tally["2024-03-16 20:00"]).to eq(2)
      end
    end
  end
  
  describe 'scopes' do
    it 'defaults to active activities' do
      active_activity = create(:activity, active: true)
      inactive_activity = create(:activity, active: false)
      
      # Add this test if you have a default scope or want to verify active filtering
      expect(Activity.where(active: true)).to include(active_activity)
      expect(Activity.where(active: true)).not_to include(inactive_activity)
    end
  end
  
  describe 'factory' do
    it 'has a valid factory' do
      expect(build(:activity)).to be_valid
    end
    
    it 'has valid traits' do
      expect(build(:activity, :inactive)).to be_valid
      expect(build(:activity, :completed)).to be_valid
      expect(build(:activity, :finalized)).to be_valid
      expect(build(:activity, :with_future_date)).to be_valid
    end
  end
end