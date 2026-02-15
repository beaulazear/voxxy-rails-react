module Api
  module V1
    module Presents
      class EventsController < BaseController
        skip_before_action :authorized, only: [ :index, :show ]
        skip_before_action :check_presents_access, only: [ :index, :show ]
        before_action :set_current_user_optional, only: [ :index, :show ]
        before_action :require_venue_owner, only: [ :create, :update, :destroy, :go_live, :command_center_data ]
        before_action :set_event, only: [ :show, :update, :destroy, :go_live, :command_center_data ]

        # GET /api/v1/presents/events
        # GET /api/v1/presents/organizations/:organization_id/events
        def index
          events = Event.includes(:organization)

          # Support nested route (events under organization)
          if params[:organization_id]
            organization = Organization.find_by!(slug: params[:organization_id])
            Rails.logger.info "=== Events Index Debug ==="
            Rails.logger.info "Organization: #{organization.inspect}"
            Rails.logger.info "Current User: #{@current_user&.id}"
            Rails.logger.info "Organization User ID: #{organization.user_id}"

            events = events.where(organization_id: organization.id)
            Rails.logger.info "Events for org (before published filter): #{events.pluck(:id, :title, :published)}"

            # Show all events (including unpublished) to the organization owner
            is_owner = @current_user && organization.user_id == @current_user.id
            Rails.logger.info "Is Owner: #{is_owner}"
            Rails.logger.info "Is Admin: #{@current_user&.admin?}"

            events = events.published unless @current_user&.admin? || is_owner
            Rails.logger.info "Events after published filter: #{events.pluck(:id, :title, :published)}"
          else
            # For general event list, only show published events unless admin
            events = events.published unless @current_user&.admin?
          end

          # Filter by status
          events = case params[:status]
          when "upcoming"
                     events.upcoming
          when "past"
                     events.past
          else
                     events.order(event_date: :desc)
          end

          serialized = events.map do |event|
            EventSerializer.new(event, include_organization: true).as_json
          end

          render json: serialized, status: :ok
        end

        # GET /api/v1/presents/events/:id
        def show
          serialized = EventSerializer.new(
            @event,
            include_organization: true,
            include_vendor_application: true
          ).as_json
          render json: serialized, status: :ok
        end

        # POST /api/v1/presents/organizations/:organization_id/events
        def create
          organization = @current_user.organizations.find_by!(slug: params[:organization_id])
          event = organization.events.build(event_params)

          if event.save
            serialized = EventSerializer.new(event, include_organization: true).as_json
            render json: serialized, status: :created
          else
            render json: { errors: event.errors.full_messages },
                   status: :unprocessable_entity
          end
        end

        # PATCH/PUT /api/v1/presents/events/:id
        def update
          if @event.update(event_params)
            serialized = EventSerializer.new(@event, include_organization: true).as_json
            response_data = { event: serialized }

            # Check if this update would trigger email notifications
            if @event.details_changed_requiring_notification?
              recipient_count = @event.email_notification_count
              response_data[:email_notification] = {
                type: "event_details_changed",
                requires_confirmation: true,
                recipient_count: recipient_count,
                warning: "Event details were updated. Would you like to notify #{recipient_count} #{'vendor'.pluralize(recipient_count)}?",
                changed_fields: @event.event_change_info[:changed_fields],
                endpoint: {
                  check: "/api/v1/presents/events/#{@event.slug}/email_notifications/check_event_update_impact",
                  send: "/api/v1/presents/events/#{@event.slug}/email_notifications/send_event_update"
                }
              }
            end

            # Check if event was just canceled
            if @event.just_canceled?
              recipient_count = @event.email_notification_count
              response_data[:email_notification] = {
                type: "event_canceled",
                requires_confirmation: true,
                recipient_count: recipient_count,
                warning: "⚠️ IMPORTANT: Event has been canceled. Would you like to notify #{recipient_count} #{'vendor'.pluralize(recipient_count)}?",
                endpoint: {
                  check: "/api/v1/presents/events/#{@event.slug}/email_notifications/check_cancellation_impact",
                  send: "/api/v1/presents/events/#{@event.slug}/email_notifications/send_cancellation"
                }
              }
            end

            render json: response_data, status: :ok
          else
            render json: { errors: @event.errors.full_messages },
                   status: :unprocessable_entity
          end
        end

        # POST /api/v1/presents/events/:id/go_live
        # Activates event by sending invitations and resuming scheduled emails
        def go_live
          # Check if already live
          if @event.is_live
            return render json: { error: "Event is already live" }, status: :unprocessable_entity
          end

          begin
            invitations_sent = 0
            emails_activated = 0

            # Step 1: Send batch invitations if invitation data exists
            if @event.invitation_list_ids.present? || @event.invitation_contact_ids.present?
              Rails.logger.info("Sending invitations for event #{@event.slug}")

              # Resolve all contact IDs from lists (same logic as event_invitations_controller)
              list_ids = @event.invitation_list_ids || []
              manual_contact_ids = @event.invitation_contact_ids || []
              excluded_contact_ids = @event.invitation_excluded_ids || []

              list_contact_ids = []
              if list_ids.any?
                lists = ContactList.where(
                  id: list_ids,
                  organization_id: @event.organization_id
                )

                lists.each do |list|
                  list_contact_ids += list.contacts.pluck(:id)
                end
              end

              # Merge and deduplicate
              all_contact_ids = (manual_contact_ids + list_contact_ids).uniq - excluded_contact_ids

              # Get contacts
              vendor_contacts = VendorContact.where(
                id: all_contact_ids,
                organization_id: @event.organization_id
              )

              # Send invitations
              vendor_contacts.each do |contact|
                # Skip if already invited
                next if @event.event_invitations.exists?(vendor_contact_id: contact.id)

                # Create and send invitation
                invitation = @event.event_invitations.create!(vendor_contact: contact)
                invitation.mark_as_sent!

                # Send email
                begin
                  EventInvitationMailer.invitation_email(invitation).deliver_now
                  invitations_sent += 1
                rescue => e
                  Rails.logger.error "Failed to send invitation to #{contact.email}: #{e.message}"
                end
              end

              Rails.logger.info("✅ Sent #{invitations_sent} invitations")
            end

            # Step 2: Activate all paused scheduled emails
            paused_emails = @event.scheduled_emails.where(status: "paused")
            emails_activated = paused_emails.count

            if emails_activated > 0
              paused_emails.update_all(status: "scheduled")
              Rails.logger.info("✅ Activated #{emails_activated} scheduled emails")
            end

            # Step 3: Mark event as live
            @event.update!(is_live: true)

            render json: {
              message: "Event is now live!",
              invitations_sent: invitations_sent,
              emails_activated: emails_activated,
              is_live: true
            }, status: :ok
          rescue => e
            Rails.logger.error("Failed to go live: #{e.message}")
            render json: { error: "Failed to activate event: #{e.message}" }, status: :unprocessable_entity
          end
        end

        # DELETE /api/v1/presents/events/:id
        def destroy
          @event.destroy
          head :no_content
        end

        # GET /api/v1/presents/events/:id/command_center
        # Compound endpoint that returns ALL data needed for Command Center in a single request
        # This eliminates N+1 queries by eager-loading all associations
        # Performance: Reduces 15-20+ sequential requests to 1 request
        def command_center_data
          # Check ownership
          unless @event.organization.user_id == @current_user.id || @current_user.admin?
            return render json: { error: "Not authorized" }, status: :forbidden
          end

          # Eager load all associations to avoid N+1 queries
          vendor_applications = @event.vendor_applications.includes(:event)

          # Fetch all submissions across all applications in one query
          all_submissions = []
          application_ids = vendor_applications.pluck(:id)

          if application_ids.any?
            all_submissions = Registration.where(vendor_application_id: application_ids)
                                         .includes(:user)
                                         .order(created_at: :desc)
                                         .to_a
          end

          # Fetch invitations with vendor contacts
          # Note: Returns ALL invitations (no limit) for accurate stats and filtering
          # Frontend uses React Query caching to avoid repeated fetches
          # Future optimization: Add pagination params (?page=1&per_page=100)
          invitations = @event.event_invitations
                             .includes(:vendor_contact)
                             .order(created_at: :desc)
                             .to_a

          # Fetch scheduled emails with associations
          # Note: Removed :email_deliveries eager loading to reduce payload size
          # The model already calculates delivery_counts efficiently via SQL aggregations
          # This reduces response size by ~80-90% for events with many deliveries
          scheduled_emails = @event.scheduled_emails
                                   .includes(:email_template_item, :latest_delivery)
                                   .order(scheduled_for: :asc)
                                   .to_a

          # Fetch bulletins
          bulletins = @event.bulletins.order(created_at: :desc).limit(10).to_a

          # Calculate stats from already-loaded data (no additional queries)
          stats = calculate_dashboard_stats(all_submissions)

          # Calculate invitation metadata
          invitation_meta = calculate_invitation_metadata(invitations)

          # Serialize everything
          response = {
            event: EventSerializer.new(@event, include_organization: true).as_json,
            vendor_applications: vendor_applications.map { |app|
              app.as_json(only: [:id, :name, :event_id, :status, :categories, :pricing, :created_at, :updated_at])
            },
            submissions: all_submissions.map { |sub|
              RegistrationSerializer.new(sub, include_user: false).as_json
            },
            invitations: invitations.map { |inv|
              EventInvitationSerializer.new(inv, include_vendor_contact: true).as_json
            },
            scheduled_emails: scheduled_emails.map { |email|
              email.as_json(
                include: { email_template_item: {}, latest_delivery: {} },
                methods: [:delivery_status]
              ).merge(
                delivery_counts: email.delivery_counts,
                undelivered_count: email.undelivered_count,
                unsubscribed_count: email.unsubscribed_count,
                delivered_count: email.delivered_count,
                delivery_rate: email.delivery_rate,
                overdue: email.overdue?,
                minutes_overdue: email.minutes_overdue,
                overdue_message: email.overdue_message
              )
            },
            bulletins: bulletins.map { |b|
              b.as_json(only: [:id, :title, :content, :message, :pinned, :created_at, :updated_at])
            },
            stats: stats,
            invitation_meta: invitation_meta,
            _metadata: {
              fetched_at: Time.current.iso8601,
              submissions_count: all_submissions.count,
              invitations_count: invitations.count,
              invitations_total: @event.event_invitations.count,
              invitations_paginated: invitations.count < @event.event_invitations.count
            }
          }

          render json: response, status: :ok
        rescue => e
          Rails.logger.error("Command Center data fetch failed: #{e.message}")
          Rails.logger.error(e.backtrace.join("\n"))
          render json: { error: "Failed to load command center data: #{e.message}" },
                 status: :internal_server_error
        end

        private

        def calculate_dashboard_stats(submissions)
          applied = submissions.count
          new_unreviewed = submissions.select { |s| s.status == 'pending' }.count
          approved = submissions.select { |s| s.status == 'approved' || s.status == 'confirmed' }
          approved_paid = approved.select { |s| s.payment_status == 'paid' }.count
          missing_payments = approved.select { |s| s.payment_status != 'paid' }.count

          {
            applied: applied,
            new_unreviewed: new_unreviewed,
            approved_paid: approved_paid,
            missing_payments: missing_payments
          }
        end

        def calculate_invitation_metadata(invitations)
          total_count = @event.event_invitations.count
          sent_count = invitations.select { |inv| inv.sent_at.present? }.count
          viewed_count = invitations.select { |inv| inv.status == 'viewed' }.count
          accepted_count = invitations.select { |inv| inv.status == 'accepted' }.count
          declined_count = invitations.select { |inv| inv.status == 'declined' }.count

          # Get delivery stats from database (single query)
          delivery_stats = calculate_invitation_delivery_stats_optimized

          {
            total_count: total_count,
            sent_count: sent_count,
            viewed_count: viewed_count,
            accepted_count: accepted_count,
            declined_count: declined_count,
            delivery_stats: delivery_stats
          }
        end

        def calculate_invitation_delivery_stats_optimized
          # Single GROUP BY query instead of 6 separate COUNT queries
          stats = EmailDelivery.where(event_id: @event.id)
                              .where.not(event_invitation_id: nil)
                              .group(:status)
                              .count

          {
            total_sent: stats.values.sum,
            delivered: stats['delivered'] || 0,
            bounced: stats['bounced'] || 0,
            dropped: stats['dropped'] || 0,
            undelivered: (stats['bounced'] || 0) + (stats['dropped'] || 0),
            unsubscribed: stats['unsubscribed'] || 0,
            pending: (stats['queued'] || 0) + (stats['sent'] || 0)
          }
        end

        def set_current_user_optional
          # Set @current_user if token is present, but don't require it
          return unless request.headers["Authorization"].present?

          token = request.headers["Authorization"].split(" ").last
          decoded = JsonWebToken.decode(token)
          @current_user = User.find_by(id: decoded[:user_id]) if decoded
        rescue
          # If token is invalid, just set @current_user to nil
          @current_user = nil
        end

        def set_event
          @event = Event.find_by!(slug: params[:id])

          # Check ownership for update/destroy
          if action_name.in?([ "update", "destroy" ])
            unless @event.organization.user_id == @current_user.id || @current_user.admin?
              render json: { error: "Not authorized" }, status: :forbidden
            end
          end
        rescue ActiveRecord::RecordNotFound
          render json: { error: "Event not found" }, status: :not_found
        end

        def event_params
          params.require(:event).permit(
            :title, :description, :event_date, :event_end_date, :location,
            :venue, :start_time, :end_time, :age_restriction,
            :poster_url, :ticket_url, :ticket_link, :ticket_price, :capacity,
            :published, :registration_open, :status, :application_deadline,
            :payment_deadline, :email_campaign_template_id,
            invitation_list_ids: [],
            invitation_contact_ids: [],
            invitation_excluded_ids: []
          )
        end
      end
    end
  end
end
