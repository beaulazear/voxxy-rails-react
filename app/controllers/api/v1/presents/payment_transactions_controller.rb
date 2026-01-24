module Api
  module V1
    module Presents
      class PaymentTransactionsController < BaseController
        before_action :set_event

        # GET /api/v1/presents/events/:event_id/payment_transactions
        def index
          transactions = @event.payment_transactions.includes(:contact, :registration)

          # Filters
          transactions = transactions.where(payment_status: params[:payment_status]) if params[:payment_status].present?
          transactions = transactions.where(provider: params[:provider]) if params[:provider].present?

          # Search by email
          transactions = transactions.where('payer_email ILIKE ?', "%#{params[:search]}%") if params[:search].present?

          # Pagination
          page = params[:page] || 1
          per_page = params[:per_page] || 50
          transactions = transactions.page(page).per(per_page)

          render json: {
            transactions: transactions.map { |t| serialize_transaction(t) },
            meta: {
              current_page: transactions.current_page,
              total_pages: transactions.total_pages,
              total_count: transactions.total_count,
              per_page: per_page.to_i
            }
          }, status: :ok
        end

        # GET /api/v1/presents/payment_transactions/:id
        def show
          transaction = @event.payment_transactions.find(params[:id])
          render json: serialize_transaction(transaction, detailed: true), status: :ok
        rescue ActiveRecord::RecordNotFound
          render json: { error: 'Transaction not found' }, status: :not_found
        end

        # PATCH /api/v1/presents/payment_transactions/:id/match
        # Manually match transaction to contact
        def match
          transaction = @event.payment_transactions.find(params[:id])
          contact = @event.organization.vendor_contacts.find(params[:contact_id])

          transaction.update!(contact: contact)

          # Update contact payment status
          contact.update!(
            payment_status: transaction.payment_status,
            payment_transaction_id: transaction.id,
            payment_provider: transaction.provider,
            payment_amount: transaction.amount,
            payment_date: transaction.transaction_created_at
          )

          # Update registration if exists
          registration = Registration.find_by(event: @event, email: contact.email)
          if registration
            registration.update!(
              vendor_fee_paid: transaction.payment_status == 'paid',
              payment_transaction_id: transaction.id,
              payment_provider: transaction.provider,
              payment_amount: transaction.amount
            )
          end

          render json: serialize_transaction(transaction), status: :ok
        rescue ActiveRecord::RecordNotFound => e
          render json: { error: e.message }, status: :not_found
        rescue => e
          Rails.logger.error("Error matching transaction: #{e.message}")
          render json: { error: e.message }, status: :internal_server_error
        end

        private

        def set_event
          @event = current_user.organization.events.find(params[:event_id])
        rescue ActiveRecord::RecordNotFound
          render json: { error: 'Event not found' }, status: :not_found
        end

        def serialize_transaction(transaction, detailed: false)
          base = {
            id: transaction.id,
            provider_transaction_id: transaction.provider_transaction_id,
            provider: transaction.provider,
            payer_email: transaction.payer_email,
            payer_first_name: transaction.payer_first_name,
            payer_last_name: transaction.payer_last_name,
            payment_status: transaction.payment_status,
            provider_status: transaction.provider_status,
            amount: transaction.amount,
            currency: transaction.currency,
            transaction_created_at: transaction.transaction_created_at,
            transaction_updated_at: transaction.transaction_updated_at,
            last_synced_at: transaction.last_synced_at,
            matched: transaction.matched?,
            contact: transaction.contact ? {
              id: transaction.contact.id,
              name: transaction.contact.name,
              email: transaction.contact.email
            } : nil,
            registration: transaction.registration ? {
              id: transaction.registration.id,
              vendor_fee_paid: transaction.registration.vendor_fee_paid,
              status: transaction.registration.status
            } : nil,
            created_at: transaction.created_at
          }

          if detailed
            base.merge!(
              notes: transaction.notes,
              raw_provider_data: transaction.raw_provider_data
            )
          end

          base
        end
      end
    end
  end
end
