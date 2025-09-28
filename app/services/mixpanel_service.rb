require "mixpanel-ruby"

class MixpanelService
  def initialize
    @tracker = if Rails.env.production?
      token = ENV["MIXPANEL_TOKEN"]
      if token.present?
        Mixpanel::Tracker.new(token)
      else
        Rails.logger.warn "Mixpanel token not found in ENV['MIXPANEL_TOKEN']"
        nil
      end
    else
      Rails.logger.info "Mixpanel tracking disabled in #{Rails.env} environment"
      nil
    end
  end

  def track(event_name, properties = {})
    return unless @tracker

    user_id = properties.delete(:user_id) || properties.delete(:user) || "anonymous"

    @tracker.track(user_id.to_s, event_name, properties)
  rescue => e
    Rails.logger.error "Mixpanel tracking error: #{e.message}"
  end

  def identify(user_id, properties = {})
    return unless @tracker

    @tracker.people.set(user_id.to_s, properties)
  rescue => e
    Rails.logger.error "Mixpanel identify error: #{e.message}"
  end

  def alias(user_id, alias_id)
    return unless @tracker

    @tracker.alias(alias_id, user_id.to_s)
  rescue => e
    Rails.logger.error "Mixpanel alias error: #{e.message}"
  end

  class << self
    def instance
      @instance ||= new
    end

    def track(event_name, properties = {})
      instance.track(event_name, properties)
    end

    def identify(user_id, properties = {})
      instance.identify(user_id, properties)
    end

    def alias(user_id, alias_id)
      instance.alias(user_id, alias_id)
    end
  end
end
