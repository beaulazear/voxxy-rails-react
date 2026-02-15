# Bulk statistics calculation for ScheduledEmail collections
# Optimizes N+1 queries by calculating stats for all emails at once
module ScheduledEmailStatistics
  extend ActiveSupport::Concern

  class_methods do
    # Calculate all statistics for a collection of scheduled emails in bulk
    # Returns a hash of email_id => { delivery_counts: {}, unsubscribed_count: 0, etc. }
    def bulk_statistics(emails, event)
      return {} if emails.empty?

      email_ids = emails.map(&:id)

      stats = {}
      emails.each { |email| stats[email.id] = default_stats }

      # Bulk fetch delivery counts for sent emails
      bulk_delivery_counts(emails, stats)

      # Bulk fetch unsubscribe counts
      bulk_unsubscribe_counts(emails, event, stats)

      stats
    end

    private

    def default_stats
      {
        delivery_counts: {},
        undelivered_count: 0,
        unsubscribed_count: 0,
        delivered_count: 0,
        delivery_rate: 0.0
      }
    end

    # Calculate delivery counts for all sent emails in one query
    def bulk_delivery_counts(emails, stats)
      sent_email_ids = emails.select { |e| e.status == "sent" }.map(&:id)
      return if sent_email_ids.empty?

      # Single query to get all delivery status counts grouped by scheduled_email_id
      counts = EmailDelivery
        .where(scheduled_email_id: sent_email_ids)
        .group(:scheduled_email_id, :status)
        .count

      sent_email_ids.each do |email_id|
        email = emails.find { |e| e.id == email_id }
        total_sent = email.recipient_count || 0

        delivered = counts[[ email_id, "delivered" ]] || 0
        bounced = counts[[ email_id, "bounced" ]] || 0
        dropped = counts[[ email_id, "dropped" ]] || 0
        unsubscribed = counts[[ email_id, "unsubscribed" ]] || 0
        queued = (counts[[ email_id, "queued" ]] || 0) + (counts[[ email_id, "sent" ]] || 0)

        stats[email_id][:delivery_counts] = {
          total_sent: total_sent,
          delivered: delivered,
          bounced: bounced,
          dropped: dropped,
          unsubscribed: unsubscribed,
          pending: queued
        }

        stats[email_id][:undelivered_count] = bounced + dropped
        stats[email_id][:delivered_count] = delivered
        stats[email_id][:delivery_rate] = total_sent.zero? ? 0.0 : (delivered.to_f / total_sent * 100).round(1)
      end
    end

    # Calculate unsubscribe counts for all emails in bulk
    def bulk_unsubscribe_counts(emails, event, stats)
      return unless event

      # Collect all unique recipient emails across all scheduled emails
      all_recipient_emails = Set.new

      emails.each do |email|
        # Skip sent emails (already counted from email_deliveries)
        next if email.status == "sent"

        recipient_emails = if is_announcement_email?(email)
          event.event_invitations.joins(:vendor_contact).pluck("vendor_contacts.email")
        else
          # Get emails from registrations that match the filter criteria
          recipients = event.registrations
          if email.filter_criteria.present?
            recipients = apply_filters(recipients, email.filter_criteria)
          end
          recipients.pluck(:email)
        end

        all_recipient_emails.merge(recipient_emails)
      end

      return if all_recipient_emails.empty?

      # Single bulk query to get all unsubscribe counts
      unsubscribe_counts = EmailUnsubscribe
        .where(email: all_recipient_emails.to_a)
        .where(
          "(scope = 'event' AND event_id = ?) OR (scope = 'organization' AND organization_id = ?) OR scope = 'global'",
          event.id,
          event.organization_id
        )
        .group(:email)
        .count

      # Map unsubscribe counts back to each scheduled email
      emails.each do |email|
        next if email.status == "sent" # Skip sent emails

        recipient_emails = if is_announcement_email?(email)
          event.event_invitations.joins(:vendor_contact).pluck("vendor_contacts.email")
        else
          recipients = event.registrations
          if email.filter_criteria.present?
            recipients = apply_filters(recipients, email.filter_criteria)
          end
          recipients.pluck(:email)
        end

        # Count how many of this email's recipients are unsubscribed
        unsubscribed = recipient_emails.count { |email_addr| unsubscribe_counts[email_addr].to_i > 0 }
        stats[email.id][:unsubscribed_count] = unsubscribed
      end
    end

    def apply_filters(recipients, filter_criteria)
      recipients = recipients.where(status: filter_criteria["status"]) if filter_criteria["status"].present?
      recipients = recipients.where(vendor_category: filter_criteria["vendor_category"]) if filter_criteria["vendor_category"].present?
      recipients = recipients.where.not(status: filter_criteria["exclude_status"]) if filter_criteria["exclude_status"].present?
      recipients
    end

    def is_announcement_email?(email)
      email.trigger_type == "on_application_open" ||
        email.name.downcase.include?("announcement") ||
        email.name.downcase.include?("immediate")
    end
  end
end
