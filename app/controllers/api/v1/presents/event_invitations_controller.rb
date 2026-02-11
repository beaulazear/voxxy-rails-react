module Api
  module V1
    module Presents
      class EventInvitationsController < BaseController
        # Skip authentication for public endpoints (view and respond by token)
        skip_before_action :authorized, only: [ :show_by_token, :respond, :prefill ]
        skip_before_action :check_presents_access, only: [ :show_by_token, :respond, :prefill ]

        before_action :require_venue_owner, except: [ :show_by_token, :respond, :prefill ]
        before_action :set_event, only: [ :index, :create_batch, :preview_email ]
        before_action :check_event_ownership, only: [ :index, :create_batch, :preview_email ]
        before_action :set_invitation_by_token, only: [ :show_by_token, :respond, :prefill ]

        # GET /api/v1/presents/events/:event_slug/invitations
        # List all invitations for an event
        def index
          invitations = @event.event_invitations.includes(:vendor_contact)

          # Apply status filter if provided
          invitations = invitations.by_status(params[:status]) if params[:status].present?

          # Order by most recent
          invitations = invitations.recent

          # Pagination parameters
          page = (params[:page] || 1).to_i
          per_page = (params[:per_page] || 50).to_i
          per_page = [ per_page, 100 ].min # Cap at 100

          # Get total count before pagination
          total_count = invitations.count

          # Apply pagination
          offset = (page - 1) * per_page
          paginated_invitations = invitations.limit(per_page).offset(offset)

          # Serialize invitations with vendor contact info
          serialized = paginated_invitations.map do |invitation|
            EventInvitationSerializer.new(invitation, include_vendor_contact: true).as_json
          end

          # Calculate metadata
          meta = {
            total_count: @event.event_invitations.count,
            pending_count: @event.event_invitations.pending.count,
            # Count invitations that have been sent (have sent_at timestamp)
            # This remains stable even when status changes to viewed/accepted/declined
            sent_count: @event.event_invitations.where.not(sent_at: nil).count,
            viewed_count: @event.event_invitations.viewed.count,
            accepted_count: @event.event_invitations.accepted.count,
            declined_count: @event.event_invitations.declined.count,
            expired_count: @event.event_invitations.expired.count,
            # Delivery tracking stats for invitation emails
            delivery_stats: calculate_invitation_delivery_stats,
            # Pagination metadata
            pagination: {
              current_page: page,
              per_page: per_page,
              total_pages: (total_count.to_f / per_page).ceil,
              total_count: total_count,
              has_next_page: page < (total_count.to_f / per_page).ceil,
              has_prev_page: page > 1
            }
          }

          render json: { invitations: serialized, meta: meta }, status: :ok
        end

        # POST /api/v1/presents/events/:event_slug/invitations/batch
        # Create multiple invitations at once
        # Accepts either:
        #   - vendor_contact_ids: [1, 2, 3] (individual contact IDs)
        #   - list_ids: [10, 20] (contact list IDs - will resolve all contacts)
        #   - excluded_contact_ids: [5, 6] (contacts to exclude from lists)
        def create_batch
          manual_contact_ids = params[:vendor_contact_ids] || []
          list_ids = params[:list_ids] || []
          excluded_contact_ids = params[:excluded_contact_ids] || []

          # Resolve all contact IDs from lists
          list_contact_ids = []
          if list_ids.any?
            lists = ContactList.where(
              id: list_ids,
              organization_id: @event.organization_id
            )

            lists.each do |list|
              # Get all contact IDs from this list (handles both smart and manual lists)
              list_contact_ids += list.contacts.pluck(:id)
            end

            Rails.logger.info("Resolved #{list_contact_ids.length} contacts from #{lists.count} lists")
          end

          # Merge manual and list contacts, remove duplicates and excluded contacts
          all_contact_ids = (manual_contact_ids + list_contact_ids).uniq - excluded_contact_ids

          if all_contact_ids.empty?
            return render json: { error: "No contacts to invite. Please select contacts or lists." },
                          status: :unprocessable_entity
          end

          # Validate that all contacts belong to the same organization as the event
          vendor_contacts = VendorContact.where(
            id: all_contact_ids,
            organization_id: @event.organization_id
          )

          Rails.logger.info("Creating batch invitations: #{vendor_contacts.count} contacts (#{manual_contact_ids.count} manual + #{list_contact_ids.uniq.count} from lists - #{excluded_contact_ids.count} excluded)")

          # Track results
          created_invitations = []
          errors = []

          vendor_contacts.each do |contact|
            # Check if invitation already exists
            existing_invitation = @event.event_invitations.find_by(vendor_contact_id: contact.id)

            if existing_invitation
              # Skip duplicate - don't count as error, just skip
              next
            end

            # Create new invitation
            invitation = @event.event_invitations.build(vendor_contact: contact)

            if invitation.save
              created_invitations << invitation
              # Mark as sent immediately (could also be done via background job)
              invitation.mark_as_sent!

              # Create EmailDelivery record BEFORE sending (ensures all invitations tracked)
              # Initial status is "queued" - will be updated to "sent" or "dropped"
              delivery_record = create_invitation_delivery_record(invitation, @event, contact)

              # Send invitation email
              begin
                mail = EventInvitationMailer.invitation_email(invitation)
                mail.deliver_now

                Rails.logger.info("✓ Sent invitation email to #{contact.email}")
              rescue => e
                Rails.logger.error "Failed to send invitation email to #{contact.email}: #{e.message}"

                # Mark delivery as failed in tracking system
                if delivery_record
                  delivery_record.update(
                    status: "dropped",
                    drop_reason: "Email send failed: #{e.message}",
                    dropped_at: Time.current
                  )
                end
              end
            else
              errors << {
                vendor_contact_id: contact.id,
                errors: invitation.errors.full_messages
              }
            end
          end

          # Serialize created invitations
          serialized = created_invitations.map do |invitation|
            EventInvitationSerializer.new(invitation, include_vendor_contact: true, include_token: true).as_json
          end

          render json: {
            invitations: serialized,
            created_count: created_invitations.count,
            errors: errors
          }, status: :created
        end

        # GET /api/v1/presents/invitations/:token
        # Public endpoint - view invitation details by token (no auth required)
        def show_by_token
          # Mark as viewed if it's the first time
          @invitation.mark_as_viewed! if @invitation.status == "sent" || @invitation.status == "pending"

          # Check if invitation has expired
          @invitation.mark_as_expired! if @invitation.expired?

          serialized = EventInvitationSerializer.new(
            @invitation,
            include_event: true,
            include_vendor_contact: true
          ).as_json

          # Add expiration status to response
          serialized[:can_respond] = @invitation.can_respond?
          serialized[:is_expired] = @invitation.expired?

          render json: { invitation: serialized }, status: :ok
        end

        # PATCH /api/v1/presents/invitations/:token/respond
        # Public endpoint - accept or decline invitation (no auth required)
        def respond
          response_status = params[:status]
          response_notes = params[:response_notes]

          unless [ "accepted", "declined" ].include?(response_status)
            return render json: { error: "Status must be 'accepted' or 'declined'" },
                          status: :unprocessable_entity
          end

          unless @invitation.can_respond?
            return render json: { error: "This invitation can no longer be responded to" },
                          status: :unprocessable_entity
          end

          success = if response_status == "accepted"
            @invitation.accept!(response_notes: response_notes)
          else
            @invitation.decline!(response_notes: response_notes)
          end

          if success
            # Send confirmation emails
            begin
              if response_status == "accepted"
                # Send confirmation to vendor
                EventInvitationMailer.accepted_confirmation_vendor(@invitation).deliver_now
                # Notify producer
                EventInvitationMailer.accepted_notification_producer(@invitation).deliver_now
              else
                # Send confirmation to vendor
                EventInvitationMailer.declined_confirmation_vendor(@invitation).deliver_now
                # Notify producer
                EventInvitationMailer.declined_notification_producer(@invitation).deliver_now
              end
            rescue => e
              Rails.logger.error "Failed to send confirmation emails: #{e.message}"
              # Don't fail the response if email fails
            end

            serialized = EventInvitationSerializer.new(
              @invitation,
              include_event: true,
              include_vendor_contact: true
            ).as_json

            render json: { invitation: serialized, message: "Response recorded successfully" }, status: :ok
          else
            render json: { error: "Failed to record response" }, status: :unprocessable_entity
          end
        end

        # GET /api/v1/presents/invitations/prefill/:token
        # Public endpoint - get vendor contact data for form pre-population (no auth required)
        # Returns: email, first_name, last_name, business_name
        def prefill
          vendor_contact = @invitation.vendor_contact

          # Parse name into first/last
          name_parts = (vendor_contact.name || "").split(" ", 2)
          first_name = name_parts[0] || ""
          last_name = name_parts[1] || ""

          render json: {
            email: vendor_contact.email || "",
            first_name: first_name,
            last_name: last_name,
            business_name: vendor_contact.business_name || ""
          }, status: :ok
        end

        # GET /api/v1/presents/events/:event_slug/invitations/preview_email
        # Preview invitation email content (for display in Email Automation tab)
        def preview_email
          # Get first invitation or use sample data
          invitation = @event.event_invitations.first
          vendor_contact = invitation&.vendor_contact

          # If no invitations exist, create sample data for preview
          unless vendor_contact
            vendor_contact = OpenStruct.new(
              name: "John Doe",
              business_name: "Sample Business",
              email: "sample@example.com"
            )
          end

          # Generate sample URLs
          invitation_url = if invitation
            invitation.invitation_url
          else
            frontend_url = FrontendUrlHelper.presents_frontend_url
            "#{frontend_url}/events/#{@event.slug}"
          end

          unsubscribe_url = ""
          begin
            unsubscribe_token = UnsubscribeTokenService.generate_token(
              email: vendor_contact.email,
              event: @event,
              organization: @event.organization
            )
            unsubscribe_url = UnsubscribeTokenService.generate_unsubscribe_url(unsubscribe_token.token)
          rescue => e
            Rails.logger.error("Failed to generate unsubscribe link for preview: #{e.message}")
          end

          # Get subject from mailer
          subject = "Submissions Open for #{@event.title}"

          # Render the invitation email template
          body = render_to_string(
            template: "event_invitation_mailer/invitation_email",
            layout: false,
            locals: {
              event: @event,
              vendor_contact: vendor_contact,
              organization: @event.organization,
              invitation_url: invitation_url,
              unsubscribe_url: unsubscribe_url
            }
          )

          render json: {
            subject: subject,
            body: body,
            recipient_name: vendor_contact.name,
            recipient_email: vendor_contact.email,
            is_sample: invitation.nil?
          }, status: :ok
        rescue => e
          Rails.logger.error("Failed to generate invitation preview: #{e.message}")
          render json: { error: "Failed to generate preview: #{e.message}" }, status: :internal_server_error
        end

        private

        def set_event
          @event = Event.find_by(slug: params[:event_id])
          unless @event
            render json: { error: "Event not found" }, status: :not_found
          end
        end

        def check_event_ownership
          return if @event.nil?

          unless @event.organization.user_id == @current_user.id || @current_user.admin?
            render json: { error: "Not authorized to manage invitations for this event" },
                   status: :forbidden
          end
        end

        def set_invitation_by_token
          @invitation = EventInvitation.includes(event: :vendor_applications)
                                       .find_by(invitation_token: params[:token])
          unless @invitation
            render json: { error: "Invitation not found" }, status: :not_found
          end
        end

        def calculate_invitation_delivery_stats
          # Get all EmailDelivery records for invitation emails for this event
          invitation_deliveries = EmailDelivery.where(event_id: @event.id)
                                               .where.not(event_invitation_id: nil)

          {
            total_sent: invitation_deliveries.count,
            delivered: invitation_deliveries.where(status: "delivered").count,
            bounced: invitation_deliveries.where(status: "bounced").count,
            dropped: invitation_deliveries.where(status: "dropped").count,
            undelivered: invitation_deliveries.where(status: [ "bounced", "dropped" ]).count,
            unsubscribed: invitation_deliveries.where(status: "unsubscribed").count,
            pending: invitation_deliveries.where(status: [ "queued", "sent" ]).count
          }
        end

        def create_invitation_delivery_record(invitation, event, contact)
          # Create EmailDelivery record BEFORE sending email
          # This ensures ALL invitations are tracked, even if email send fails
          # Use recipient email as lookup key since we can't get SendGrid message ID from SMTP
          # Webhook will find this record by matching recipient_email + event_invitation_id

          EmailDelivery.create!(
            event_id: event.id,
            event_invitation_id: invitation.id,
            sendgrid_message_id: "pending-#{invitation.id}-#{Time.current.to_i}",
            recipient_email: contact.email,
            status: "queued",  # Initial status - indicates send attempt in progress
            sent_at: Time.current
          )

          Rails.logger.info("Created delivery tracking record for invitation ##{invitation.id} to #{contact.email}")
        rescue ActiveRecord::RecordInvalid => e
          Rails.logger.error("Failed to create invitation delivery record: #{e.message}")
          nil
        end
      end
    end
  end
end
