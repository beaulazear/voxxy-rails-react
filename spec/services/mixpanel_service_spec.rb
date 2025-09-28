require 'rails_helper'

RSpec.describe MixpanelService do
  describe "#initialize" do
    context "in production environment" do
      before { allow(Rails).to receive(:env).and_return(ActiveSupport::StringInquirer.new("production")) }

      context "with MIXPANEL_TOKEN set" do
        before { ENV['MIXPANEL_TOKEN'] = 'test_token_123' }
        after { ENV.delete('MIXPANEL_TOKEN') }

        it "initializes tracker" do
          expect(Mixpanel::Tracker).to receive(:new).with('test_token_123')
          described_class.new
        end
      end

      context "without MIXPANEL_TOKEN" do
        before { ENV.delete('MIXPANEL_TOKEN') }

        it "logs warning and doesn't initialize tracker" do
          expect(Rails.logger).to receive(:warn).with("Mixpanel token not found in ENV['MIXPANEL_TOKEN']")
          expect(Mixpanel::Tracker).not_to receive(:new)
          described_class.new
        end
      end
    end

    context "in development environment" do
      before { allow(Rails).to receive(:env).and_return(ActiveSupport::StringInquirer.new("development")) }

      it "logs info and doesn't initialize tracker" do
        expect(Rails.logger).to receive(:info).with("Mixpanel tracking disabled in development environment")
        expect(Mixpanel::Tracker).not_to receive(:new)
        described_class.new
      end
    end
  end

  describe "#track" do
    let(:service) { described_class.new }

    context "when tracker is nil" do
      it "returns early without tracking" do
        expect(service.track("Test Event", { user_id: 1 })).to be_nil
      end
    end
  end

  describe "#identify" do
    let(:service) { described_class.new }

    context "when tracker is nil" do
      it "returns early without identifying" do
        expect(service.identify(1, { name: "Test User" })).to be_nil
      end
    end
  end

  describe ".instance" do
    it "returns singleton instance" do
      instance1 = described_class.instance
      instance2 = described_class.instance
      expect(instance1).to be(instance2)
    end
  end

  describe ".track" do
    it "delegates to instance" do
      expect(described_class.instance).to receive(:track).with("Event", { prop: "value" })
      described_class.track("Event", { prop: "value" })
    end
  end

  describe ".identify" do
    it "delegates to instance" do
      expect(described_class.instance).to receive(:identify).with(1, { name: "User" })
      described_class.identify(1, { name: "User" })
    end
  end
end
