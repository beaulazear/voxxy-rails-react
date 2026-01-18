class Api::V1::Presents::EventPortalsController < ApplicationController
  skip_before_action :authorized, only: [:verify_access, :show_by_slug]
  skip_before_action :check_presents_access, only: [:verify_access, :show_by_slug]

  # POST /api/v1/presents/portals/verify
  # Params: { event_slug: "summer-art-market", application_code: "EVENT-202601-ABC123", email: "vendor@example.com" }
  def verify_access
    event = Event.find_by!(slug: params[:event_slug])
    application_code = params[:application_code]&.strip
    email = params[:email]&.downcase&.strip

    # Find the vendor application by code and ensure it belongs to this event
    vendor_application = VendorApplication.find_by(shareable_code: application_code, event_id: event.id)

    unless vendor_application
      return render json: {
        access_granted: false,
        error: "Invalid application code for this event"
      }, status: :not_found
    end

    # Check if email exists in invitations for this event
    invited = event.event_invitations.joins(:vendor_contact).exists?(
      vendor_contacts: { email: email }
    )

    # Check if email exists in registrations (applied) for this event
    applied = event.registrations.exists?(email: email)

    if invited && applied
      # Track portal view
      event.event_portal&.track_view!

      # Generate session token
      portal_token = generate_session_token(event.id, email)

      render json: {
        access_granted: true,
        portal_token: portal_token,
        event_slug: event.slug
      }
    elsif invited && !applied
      render json: {
        access_granted: false,
        error: "You must submit an application before accessing the portal"
      }, status: :forbidden
    else
      render json: {
        access_granted: false,
        error: "Email not found for this event. Make sure you were invited."
      }, status: :not_found
    end
  rescue ActiveRecord::RecordNotFound
    render json: {
      access_granted: false,
      error: "Event not found"
    }, status: :not_found
  end

  # GET /api/v1/presents/portals/:event_slug
  # Headers: X-Portal-Token (from verify_access)
  def show_by_slug
    event = Event.find_by!(slug: params[:event_slug])

    # Verify session token
    verify_portal_token!(event.id)

    render json: Api::V1::Presents::EventPortalSerializer.new(
      event.event_portal,
      include: [:event, :'event.vendor_applications', :'event.organization']
    ).serializable_hash
  rescue ActiveRecord::RecordNotFound
    render json: { error: "Event not found" }, status: :not_found
  end

  private

  def generate_session_token(event_id, email)
    # Simple JWT for session management
    payload = {
      event_id: event_id,
      email: email,
      exp: 24.hours.from_now.to_i
    }
    JWT.encode(payload, Rails.application.secret_key_base)
  end

  def verify_portal_token!(event_id)
    token = request.headers['X-Portal-Token']
    return render_unauthorized unless token

    begin
      decoded = JWT.decode(token, Rails.application.secret_key_base)[0]

      unless decoded['event_id'] == event_id
        render_unauthorized
      end
    rescue JWT::DecodeError, JWT::ExpiredSignature
      render_unauthorized
    end
  end

  def render_unauthorized
    render json: { error: 'Invalid or expired session' }, status: :unauthorized
  end
end
