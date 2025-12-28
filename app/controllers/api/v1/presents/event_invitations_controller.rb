module Api
  module V1
    module Presents
      class EventInvitationsController < BaseController
        # Skip authentication for public endpoints (view and respond by token)
        skip_before_action :authorized, only: [ :show_by_token, :respond ]
        skip_before_action :check_presents_access, only: [ :show_by_token, :respond ]

        before_action :require_venue_owner, except: [ :show_by_token, :respond ]
        before_action :set_event, only: [ :index, :create_batch ]
        before_action :check_event_ownership, only: [ :index, :create_batch ]
        before_action :set_invitation_by_token, only: [ :show_by_token, :respond ]

        # GET /api/v1/presents/events/:event_slug/invitations
        # List all invitations for an event
        def index
          invitations = @event.event_invitations.includes(:vendor_contact)

          # Apply status filter if provided
          invitations = invitations.by_status(params[:status]) if params[:status].present?

          # Order by most recent
          invitations = invitations.recent

          # Serialize invitations with vendor contact info
          serialized = invitations.map do |invitation|
            EventInvitationSerializer.new(invitation, include_vendor_contact: true).as_json
          end

          # Calculate metadata
          meta = {
            total_count: @event.event_invitations.count,
            pending_count: @event.event_invitations.pending.count,
            sent_count: @event.event_invitations.sent.count,
            viewed_count: @event.event_invitations.viewed.count,
            accepted_count: @event.event_invitations.accepted.count,
            declined_count: @event.event_invitations.declined.count,
            expired_count: @event.event_invitations.expired.count
          }

          render json: { invitations: serialized, meta: meta }, status: :ok
        end

        # POST /api/v1/presents/events/:event_slug/invitations/batch
        # Create multiple invitations at once
        def create_batch
          vendor_contact_ids = params[:vendor_contact_ids] || []

          if vendor_contact_ids.empty?
            return render json: { error: "vendor_contact_ids cannot be empty" },
                          status: :unprocessable_entity
          end

          # Validate that all contacts belong to the same organization as the event
          vendor_contacts = VendorContact.where(
            id: vendor_contact_ids,
            organization_id: @event.organization_id
          )

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

              # Send invitation email
              begin
                EventInvitationMailer.invitation_email(invitation).deliver_now
              rescue => e
                Rails.logger.error "Failed to send invitation email: #{e.message}"
                # Don't fail the entire operation if email fails
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
      end
    end
  end
end
