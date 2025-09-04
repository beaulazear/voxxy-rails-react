require 'rails_helper'

RSpec.describe Report, type: :model do
  let(:user) { create(:user) }
  let(:reporter) { create(:user) }
  let(:admin) { create(:user, admin: true) }
  let(:comment) { create(:comment, user: user) }
  let(:activity) { create(:activity, user: user) }
  
  describe 'associations' do
    it { should belong_to(:reportable) }
    it { should belong_to(:reporter).class_name("User") }
    it { should belong_to(:activity).optional }
    it { should belong_to(:reviewed_by).class_name("User").optional }
  end

  describe 'validations' do
    it { should validate_presence_of(:reason) }
    it { should validate_inclusion_of(:status).in_array(%w[pending reviewing resolved dismissed]) }
    it { should validate_inclusion_of(:resolution_action).in_array(%w[content_deleted user_warned user_suspended user_banned dismissed no_action]).allow_nil }

    context 'duplicate report prevention' do
      it 'prevents same user from reporting same content twice' do
        create(:report, reporter: reporter, reportable: comment, reason: 'spam')
        duplicate = build(:report, reporter: reporter, reportable: comment, reason: 'harassment')
        
        expect(duplicate).not_to be_valid
        expect(duplicate.errors[:reporter_id]).to include("has already reported this content")
      end

      it 'allows different users to report same content' do
        create(:report, reporter: reporter, reportable: comment, reason: 'spam')
        another_report = build(:report, reporter: user, reportable: comment, reason: 'spam')
        
        expect(another_report).to be_valid
      end
    end
  end

  describe 'scopes' do
    let!(:pending_report) { create(:report, status: 'pending', created_at: 2.hours.ago) }
    let!(:reviewing_report) { create(:report, status: 'reviewing') }
    let!(:resolved_report) { create(:report, status: 'resolved') }
    let!(:dismissed_report) { create(:report, status: 'dismissed') }
    let!(:overdue_report) { create(:report, status: 'pending', created_at: 25.hours.ago) }

    describe '.pending' do
      it 'returns only pending reports' do
        expect(Report.pending).to contain_exactly(pending_report, overdue_report)
      end
    end

    describe '.reviewing' do
      it 'returns only reports under review' do
        expect(Report.reviewing).to contain_exactly(reviewing_report)
      end
    end

    describe '.resolved' do
      it 'returns only resolved reports' do
        expect(Report.resolved).to contain_exactly(resolved_report)
      end
    end

    describe '.dismissed' do
      it 'returns only dismissed reports' do
        expect(Report.dismissed).to contain_exactly(dismissed_report)
      end
    end

    describe '.overdue' do
      it 'returns pending reports older than 24 hours' do
        expect(Report.overdue).to contain_exactly(overdue_report)
      end
    end

    describe '.recent' do
      it 'orders reports by most recent first' do
        expect(Report.recent.first).to eq(dismissed_report)
        expect(Report.recent.last).to eq(overdue_report)
      end
    end
  end

  describe 'callbacks' do
    it 'sends admin notification after creation' do
      service = instance_double(ReportNotificationService)
      expect(ReportNotificationService).to receive(:new).and_return(service)
      expect(service).to receive(:send_admin_notification)
      
      create(:report)
    end
  end

  describe '#review!' do
    let(:report) { create(:report, status: 'pending') }

    it 'marks report as under review' do
      report.review!(admin)
      
      expect(report.status).to eq('reviewing')
      expect(report.reviewed_by).to eq(admin)
      expect(report.reviewed_at).to be_present
    end
  end

  describe '#resolve!' do
    let(:report) { create(:report, status: 'reviewing', reviewed_by: admin) }

    context 'with content_deleted action' do
      it 'resolves report and deletes content' do
        expect(report.reportable).to receive(:destroy!)
        
        report.resolve!('content_deleted', 'Violates terms', admin)
        
        expect(report.status).to eq('resolved')
        expect(report.resolution_action).to eq('content_deleted')
        expect(report.resolution_notes).to eq('Violates terms')
      end
    end

    context 'with user_warned action' do
      it 'resolves report and warns user' do
        service = instance_double(UserModerationEmailService)
        # Expect two calls - one from report, one from moderation action
        expect(UserModerationEmailService).to receive(:new).twice.and_return(service)
        expect(service).to receive(:send_email).twice
        
        report.resolve!('user_warned', 'First offense', admin)
        
        expect(report.status).to eq('resolved')
        expect(report.resolution_action).to eq('user_warned')
      end
    end

    context 'with user_suspended action' do
      it 'resolves report and suspends user' do
        report = create(:report, reportable: comment)
        user_to_suspend = report.reported_user
        
        expect(user_to_suspend).to receive(:suspend!).with(7.days, "Content violation: #{report.reason}", anything)
        
        report.resolve!('user_suspended', 'Repeated violations', admin)
        
        expect(report.status).to eq('resolved')
      end
    end

    context 'with user_banned action' do
      it 'resolves report and bans user' do
        report = create(:report, reportable: comment)
        user_to_ban = report.reported_user
        
        expect(user_to_ban).to receive(:ban!).with("Content violation: #{report.reason}", anything)
        
        report.resolve!('user_banned', 'Severe violation', admin)
        
        expect(report.status).to eq('resolved')
      end
    end
  end

  describe '#dismiss!' do
    let(:report) { create(:report, status: 'reviewing', reviewed_by: admin) }

    it 'dismisses the report' do
      report.dismiss!('Not a violation', admin)
      
      expect(report.status).to eq('dismissed')
      expect(report.resolution_action).to eq('dismissed')
      expect(report.resolution_notes).to eq('Not a violation')
      expect(report.reviewed_at).to be_present
    end
  end

  describe '#overdue?' do
    it 'returns true for pending reports older than 24 hours' do
      overdue = create(:report, status: 'pending', created_at: 25.hours.ago)
      not_overdue = create(:report, status: 'pending', created_at: 23.hours.ago)
      resolved = create(:report, status: 'resolved', created_at: 25.hours.ago)
      
      expect(overdue.overdue?).to be true
      expect(not_overdue.overdue?).to be false
      expect(resolved.overdue?).to be false
    end
  end

  describe '#reported_user' do
    context 'when reportable is a Comment' do
      let(:report) { create(:report, reportable: comment) }
      
      it 'returns the comment author' do
        expect(report.reported_user).to eq(comment.user)
      end
    end

    context 'when reportable is a User' do
      let(:report) { create(:report, reportable: user) }
      
      it 'returns the reported user' do
        expect(report.reported_user).to eq(user)
      end
    end

    context 'when reportable is an Activity' do
      let(:report) { create(:report, reportable: activity) }
      
      it 'returns the activity host' do
        expect(report.reported_user).to eq(activity.user)
      end
    end
  end

  describe '#reported_content' do
    context 'when reportable is a Comment' do
      let(:comment) { create(:comment, content: 'Test comment content') }
      let(:report) { create(:report, reportable: comment) }
      
      it 'returns comment content' do
        expect(report.reported_content).to eq('Test comment content')
      end
    end

    context 'when reportable is an Activity' do
      let(:activity) { create(:activity, activity_name: 'Test Activity') }
      let(:report) { create(:report, reportable: activity) }
      
      it 'returns activity name' do
        expect(report.reported_content).to eq('Test Activity')
      end
    end

    context 'when reportable is other type' do
      let(:report) { create(:report, reportable: user) }
      
      it 'returns N/A' do
        expect(report.reported_content).to eq('N/A')
      end
    end
  end

  describe 'Report::REASONS' do
    it 'includes all expected reason types' do
      expect(Report::REASONS).to include(
        spam: "Spam or misleading",
        harassment: "Harassment or bullying",
        hate: "Hate speech or discrimination",
        inappropriate: "Inappropriate or offensive",
        violence: "Violence or dangerous content",
        other: "Other"
      )
    end
  end
end