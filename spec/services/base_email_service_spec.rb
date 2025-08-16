require 'rails_helper'

RSpec.describe BaseEmailService do
  describe '.app_base_url' do
    context 'in production environment' do
      before do
        allow(Rails).to receive(:env).and_return(ActiveSupport::StringInquirer.new('production'))
      end

      it 'uses PRIMARY_DOMAIN environment variable when set' do
        allow(ENV).to receive(:fetch).with('PRIMARY_DOMAIN', 'voxxyai.com').and_return('heyvoxxy.com')
        expect(described_class.app_base_url).to eq('https://heyvoxxy.com')
      end

      it 'defaults to voxxyai.com when PRIMARY_DOMAIN is not set' do
        allow(ENV).to receive(:fetch).with('PRIMARY_DOMAIN', 'voxxyai.com').and_return('voxxyai.com')
        expect(described_class.app_base_url).to eq('https://voxxyai.com')
      end

      it 'works with www subdomain' do
        allow(ENV).to receive(:fetch).with('PRIMARY_DOMAIN', 'voxxyai.com').and_return('www.heyvoxxy.com')
        expect(described_class.app_base_url).to eq('https://www.heyvoxxy.com')
      end
    end

    context 'in development environment' do
      before do
        allow(Rails).to receive(:env).and_return(ActiveSupport::StringInquirer.new('development'))
      end

      it 'returns localhost URL' do
        expect(described_class.app_base_url).to eq('http://localhost:3000')
      end

      it 'ignores PRIMARY_DOMAIN in development' do
        allow(ENV).to receive(:fetch).with('PRIMARY_DOMAIN', 'voxxyai.com').and_return('heyvoxxy.com')
        expect(described_class.app_base_url).to eq('http://localhost:3000')
      end
    end

    context 'in test environment' do
      it 'returns localhost URL' do
        expect(described_class.app_base_url).to eq('http://localhost:3000')
      end
    end
  end

  describe 'email sender configuration' do
    it 'uses team@voxxyai.com as sender email' do
      expect(described_class::SENDER_EMAIL).to eq('team@voxxyai.com')
    end

    it 'uses Voxxy as sender name' do
      expect(described_class::SENDER_NAME).to eq('Voxxy')
    end
  end
end
