class PaymentSyncWorker
  include Sidekiq::Worker
  sidekiq_options retry: 3, queue: :payment_sync

  def perform(payment_integration_id = nil)
    if payment_integration_id
      # Sync specific integration
      sync_single_integration(payment_integration_id)
    else
      # Sync all active integrations
      sync_all_active_integrations
    end
  end

  private

  def sync_single_integration(payment_integration_id)
    integration = PaymentIntegration.find(payment_integration_id)
    return unless integration.active? && integration.auto_sync_enabled?

    Rails.logger.info("Starting payment sync for integration #{integration.id}")
    PaymentSyncService.new(integration).sync
  rescue => e
    Rails.logger.error("Payment sync failed for integration #{payment_integration_id}: #{e.message}")
    raise
  end

  def sync_all_active_integrations
    integrations = PaymentIntegration.active_syncs
    Rails.logger.info("Starting payment sync for #{integrations.count} active integrations")

    integrations.find_each do |integration|
      begin
        PaymentSyncService.new(integration).sync
      rescue => e
        # Log error but continue with other integrations
        Rails.logger.error("Payment sync failed for integration #{integration.id}: #{e.message}")
      end
    end
  end
end
