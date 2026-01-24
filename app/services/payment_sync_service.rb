class PaymentSyncService
  attr_reader :payment_integration, :sync_log

  def initialize(payment_integration)
    @payment_integration = payment_integration
    @provider = build_provider
  end

  def sync(sync_type: 'incremental')
    return unless payment_integration.auto_sync_enabled?

    @sync_log = create_sync_log(sync_type)

    # Determine if full or incremental sync
    changed_since = sync_type == 'full' ? nil : payment_integration.last_synced_at

    # Fetch transactions from provider
    transactions = @provider.fetch_transactions(changed_since: changed_since)
    sync_log.update(transactions_fetched: transactions.size)

    # Upsert transactions to database
    upsert_transactions(transactions)

    # Match transactions to contacts/registrations
    match_and_update_vendor_status

    # Update sync metadata
    update_sync_state

    # Complete the sync log
    complete_sync_log

    sync_log
  rescue => e
    handle_sync_error(e)
  end

  private

  def build_provider
    case payment_integration.provider
    when 'eventbrite'
      PaymentProviders::EventbriteProvider.new(payment_integration)
    else
      raise "Unsupported provider: #{payment_integration.provider}"
    end
  end

  def upsert_transactions(transactions)
    transactions.each do |txn_data|
      # Find existing transaction or create new one
      txn = PaymentTransaction.find_or_initialize_by(
        provider_transaction_id: txn_data[:provider_transaction_id]
      )

      # Track if this is a new record
      is_new = txn.new_record?

      # Update attributes
      txn.assign_attributes(
        payment_integration: payment_integration,
        event: payment_integration.event,
        payer_email: txn_data[:payer_email],
        payer_first_name: txn_data[:payer_first_name],
        payer_last_name: txn_data[:payer_last_name],
        provider: txn_data[:provider],
        provider_status: txn_data[:provider_status],
        payment_status: txn_data[:payment_status],
        amount: txn_data[:amount],
        currency: txn_data[:currency],
        transaction_created_at: txn_data[:transaction_created_at],
        transaction_updated_at: txn_data[:transaction_updated_at],
        raw_provider_data: txn_data[:raw_provider_data],
        last_synced_at: Time.current
      )

      # Save and track counts
      if txn.changed?
        txn.save!
        if is_new
          sync_log.increment!(:transactions_inserted)
        else
          sync_log.increment!(:transactions_updated)
        end
      end
    end
  end

  def match_and_update_vendor_status
    event = payment_integration.event
    organization = payment_integration.organization

    # Find unmatched transactions for this integration
    PaymentTransaction
      .where(payment_integration: payment_integration)
      .where(vendor_contact_id: nil)
      .find_each do |transaction|

      # Find vendor contact by email + organization
      vendor_contact = VendorContact.find_by(
        email: transaction.payer_email&.downcase&.strip,
        organization_id: organization.id
      )

      next unless vendor_contact # Skip if no matching vendor

      # Link transaction to vendor contact
      transaction.update(vendor_contact: vendor_contact)
      sync_log.increment!(:contacts_matched)

      # Update vendor contact payment status if auto-update enabled
      if payment_integration.auto_update_payment_status?
        update_contact_payment_status(vendor_contact, transaction)
      end

      # Find and update registration if exists
      registration = Registration.find_by(
        event: event,
        email: transaction.payer_email&.downcase&.strip
      )

      if registration
        update_registration_payment_status(registration, transaction)
      end
    end
  end

  def update_contact_payment_status(contact, transaction)
    contact.update(
      payment_status: transaction.payment_status,
      payment_transaction_id: transaction.id,
      payment_provider: transaction.provider,
      payment_amount: transaction.amount,
      payment_date: transaction.transaction_created_at
    )

    sync_log.increment!(:contacts_updated)
  end

  def update_registration_payment_status(registration, transaction)
    # Toggle the existing vendor_fee_paid boolean
    # This will trigger the existing payment confirmation email
    vendor_fee_paid = transaction.payment_status == 'paid'

    registration.update(
      vendor_fee_paid: vendor_fee_paid,
      payment_transaction_id: transaction.id,
      payment_provider: transaction.provider,
      payment_amount: transaction.amount
    )

    sync_log.increment!(:registrations_updated)
  end

  def create_sync_log(sync_type)
    payment_integration.payment_sync_logs.create!(
      sync_type: sync_type,
      started_at: Time.current
    )
  end

  def update_sync_state
    payment_integration.update(
      last_synced_at: Time.current,
      sync_status: 'active',
      sync_metadata: payment_integration.sync_metadata.merge(
        last_sync_type: sync_log.sync_type,
        last_sync_at: Time.current.iso8601,
        last_error: nil
      )
    )
  end

  def complete_sync_log
    sync_log.update(completed_at: Time.current)
    Rails.logger.info("Payment sync completed for integration #{payment_integration.id}: #{sync_log.transactions_fetched} fetched, #{sync_log.transactions_inserted} inserted, #{sync_log.transactions_updated} updated, #{sync_log.contacts_matched} matched")
  end

  def handle_sync_error(error)
    Rails.logger.error("Payment sync error for integration #{payment_integration.id}: #{error.message}")
    Rails.logger.error(error.backtrace.join("\n"))

    payment_integration.update(
      sync_status: 'error',
      sync_metadata: payment_integration.sync_metadata.merge(
        last_error: error.message,
        last_error_at: Time.current.iso8601
      )
    )

    if sync_log
      sync_log.update(
        error_messages: error.message,
        completed_at: Time.current
      )
    end

    # Alert admin if 3+ consecutive failures
    alert_admin_if_critical

    raise error
  end

  def alert_admin_if_critical
    recent_logs = payment_integration.payment_sync_logs.order(created_at: :desc).limit(3)

    if recent_logs.size >= 3 && recent_logs.all? { |log| log.error_messages.present? }
      # TODO: Send admin email alert
      Rails.logger.error("CRITICAL: Payment sync has failed 3 times consecutively for integration #{payment_integration.id}")
    end
  end
end
