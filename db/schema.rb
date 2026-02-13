# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.2].define(version: 2026_02_13_143332) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "active_storage_attachments", force: :cascade do |t|
    t.string "name", null: false
    t.string "record_type", null: false
    t.bigint "record_id", null: false
    t.bigint "blob_id", null: false
    t.datetime "created_at", null: false
    t.index ["blob_id"], name: "index_active_storage_attachments_on_blob_id"
    t.index ["record_type", "record_id", "name", "blob_id"], name: "index_active_storage_attachments_uniqueness", unique: true
  end

  create_table "active_storage_blobs", force: :cascade do |t|
    t.string "key", null: false
    t.string "filename", null: false
    t.string "content_type"
    t.text "metadata"
    t.string "service_name", null: false
    t.bigint "byte_size", null: false
    t.string "checksum"
    t.datetime "created_at", null: false
    t.index ["key"], name: "index_active_storage_blobs_on_key", unique: true
  end

  create_table "active_storage_variant_records", force: :cascade do |t|
    t.bigint "blob_id", null: false
    t.string "variation_digest", null: false
    t.index ["blob_id", "variation_digest"], name: "index_active_storage_variant_records_uniqueness", unique: true
  end

  create_table "activities", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "activity_name"
    t.string "activity_location"
    t.string "group_size"
    t.string "date_notes"
    t.string "activity_type"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "active", default: true, null: false
    t.string "emoji"
    t.time "date_time"
    t.date "date_day"
    t.text "welcome_message"
    t.boolean "completed", default: false, null: false
    t.boolean "finalized", default: false
    t.integer "radius"
    t.boolean "collecting", default: false
    t.boolean "voting", default: false
    t.boolean "allow_participant_time_selection", default: false
    t.boolean "is_solo", default: false, null: false
    t.index ["user_id"], name: "index_activities_on_user_id"
  end

  create_table "activity_participants", force: :cascade do |t|
    t.bigint "user_id"
    t.bigint "activity_id", null: false
    t.string "invited_email"
    t.boolean "accepted", default: false, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "guest_response_token"
    t.index ["activity_id", "accepted"], name: "index_activity_participants_on_activity_and_accepted"
    t.index ["activity_id"], name: "index_activity_participants_on_activity_id"
    t.index ["guest_response_token"], name: "index_activity_participants_on_guest_response_token", unique: true
    t.index ["user_id", "accepted"], name: "index_activity_participants_on_user_and_accepted"
    t.index ["user_id"], name: "index_activity_participants_on_user_id"
  end

  create_table "blocked_users", force: :cascade do |t|
    t.bigint "blocker_id", null: false
    t.bigint "blocked_id", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["blocked_id"], name: "index_blocked_users_on_blocked_id"
    t.index ["blocker_id", "blocked_id"], name: "index_blocked_users_on_blocker_id_and_blocked_id", unique: true
    t.index ["blocker_id"], name: "index_blocked_users_on_blocker_id"
  end

  create_table "budget_line_items", force: :cascade do |t|
    t.bigint "budget_id", null: false
    t.string "name", null: false
    t.string "category"
    t.decimal "budgeted_amount", precision: 10, scale: 2
    t.decimal "actual_amount", precision: 10, scale: 2, default: "0.0"
    t.text "notes"
    t.bigint "vendor_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["budget_id"], name: "index_budget_line_items_on_budget_id"
    t.index ["category"], name: "index_budget_line_items_on_category"
    t.index ["vendor_id"], name: "index_budget_line_items_on_vendor_id"
  end

  create_table "budgets", force: :cascade do |t|
    t.string "budgetable_type", null: false
    t.bigint "budgetable_id", null: false
    t.bigint "user_id", null: false
    t.string "title"
    t.decimal "total_amount", precision: 10, scale: 2
    t.decimal "spent_amount", precision: 10, scale: 2, default: "0.0"
    t.string "status"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["budgetable_type", "budgetable_id"], name: "index_budgets_on_budgetable"
    t.index ["user_id"], name: "index_budgets_on_user_id"
  end

  create_table "bug_reports", force: :cascade do |t|
    t.string "name", null: false
    t.string "email", null: false
    t.text "bug_description", null: false
    t.text "steps_to_reproduce"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_bug_reports_on_email"
  end

  create_table "bulletin_reads", force: :cascade do |t|
    t.bigint "bulletin_id", null: false
    t.bigint "user_id"
    t.string "registration_email"
    t.datetime "read_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["bulletin_id", "registration_email"], name: "index_bulletin_reads_on_bulletin_and_email", unique: true, where: "(registration_email IS NOT NULL)"
    t.index ["bulletin_id", "user_id"], name: "index_bulletin_reads_on_bulletin_and_user", unique: true, where: "(user_id IS NOT NULL)"
    t.index ["bulletin_id"], name: "index_bulletin_reads_on_bulletin_id"
    t.index ["user_id"], name: "index_bulletin_reads_on_user_id"
  end

  create_table "bulletins", force: :cascade do |t|
    t.bigint "event_id", null: false
    t.bigint "author_id", null: false
    t.string "subject", null: false
    t.text "body", null: false
    t.string "bulletin_type", default: "announcement"
    t.boolean "pinned", default: false
    t.integer "view_count", default: 0
    t.jsonb "metadata", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["author_id"], name: "index_bulletins_on_author_id"
    t.index ["event_id", "created_at"], name: "index_bulletins_on_event_id_and_created_at"
    t.index ["event_id", "pinned"], name: "index_bulletins_on_event_id_and_pinned"
    t.index ["event_id"], name: "index_bulletins_on_event_id"
  end

  create_table "comments", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "pinned_activity_id"
    t.text "content"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "activity_id"
    t.index ["pinned_activity_id"], name: "index_comments_on_pinned_activity_id"
    t.index ["user_id"], name: "index_comments_on_user_id"
  end

  create_table "contact_lists", force: :cascade do |t|
    t.bigint "organization_id", null: false
    t.string "name", null: false
    t.string "list_type", null: false
    t.text "description"
    t.jsonb "filters", default: {}
    t.integer "contact_ids", default: [], array: true
    t.integer "contacts_count", default: 0
    t.datetime "last_used_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["filters"], name: "index_contact_lists_on_filters", using: :gin
    t.index ["list_type"], name: "index_contact_lists_on_list_type"
    t.index ["organization_id", "name"], name: "index_contact_lists_on_organization_id_and_name", unique: true
    t.index ["organization_id"], name: "index_contact_lists_on_organization_id"
  end

  create_table "contacts", force: :cascade do |t|
    t.string "name", null: false
    t.string "email", null: false
    t.string "subject", null: false
    t.text "message", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.integer "payment_status", default: 0
    t.bigint "payment_transaction_id"
    t.string "payment_provider"
    t.decimal "payment_amount", precision: 10, scale: 2
    t.datetime "payment_date"
    t.index ["email"], name: "index_contacts_on_email"
    t.index ["payment_status"], name: "index_contacts_on_payment_status"
    t.index ["payment_transaction_id"], name: "index_contacts_on_payment_transaction_id"
  end

  create_table "email_campaign_templates", force: :cascade do |t|
    t.string "template_type", null: false
    t.bigint "organization_id"
    t.string "name", null: false
    t.text "description"
    t.boolean "is_default", default: false
    t.integer "email_count", default: 0
    t.integer "events_count", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["organization_id", "name"], name: "index_email_campaign_templates_on_organization_id_and_name", unique: true
    t.index ["organization_id"], name: "index_email_campaign_templates_on_organization_id"
    t.index ["template_type", "is_default"], name: "index_email_campaign_templates_on_template_type_and_is_default"
  end

  create_table "email_deliveries", force: :cascade do |t|
    t.bigint "scheduled_email_id"
    t.bigint "event_id", null: false
    t.bigint "registration_id"
    t.string "sendgrid_message_id", null: false
    t.string "recipient_email", null: false
    t.string "status", default: "queued", null: false
    t.string "bounce_type"
    t.text "bounce_reason"
    t.text "drop_reason"
    t.datetime "sent_at"
    t.datetime "delivered_at"
    t.datetime "bounced_at"
    t.datetime "dropped_at"
    t.datetime "unsubscribed_at"
    t.integer "retry_count", default: 0
    t.datetime "next_retry_at"
    t.integer "max_retries", default: 3
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "event_invitation_id"
    t.datetime "opened_at"
    t.datetime "clicked_at"
    t.datetime "failed_at"
    t.text "error_message"
    t.index ["event_id", "status"], name: "index_email_deliveries_on_event_id_and_status"
    t.index ["event_id"], name: "index_email_deliveries_on_event_id"
    t.index ["event_invitation_id"], name: "index_email_deliveries_on_event_invitation_id"
    t.index ["failed_at"], name: "index_email_deliveries_on_failed_at", where: "(failed_at IS NOT NULL)"
    t.index ["next_retry_at"], name: "index_email_deliveries_on_next_retry_at", where: "(next_retry_at IS NOT NULL)"
    t.index ["registration_id", "status"], name: "index_email_deliveries_on_registration_id_and_status"
    t.index ["registration_id"], name: "index_email_deliveries_on_registration_id"
    t.index ["scheduled_email_id"], name: "index_email_deliveries_on_scheduled_email_id"
    t.index ["sendgrid_message_id"], name: "index_email_deliveries_on_sendgrid_message_id", unique: true
    t.check_constraint "scheduled_email_id IS NOT NULL OR event_invitation_id IS NOT NULL", name: "check_email_source_present"
  end

  create_table "email_template_items", force: :cascade do |t|
    t.bigint "email_campaign_template_id", null: false
    t.string "name", null: false
    t.text "description"
    t.string "category"
    t.integer "position", default: 0
    t.string "subject_template", null: false
    t.text "body_template", null: false
    t.string "trigger_type", null: false
    t.integer "trigger_value"
    t.time "trigger_time"
    t.jsonb "filter_criteria", default: {}
    t.boolean "enabled_by_default", default: true
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["category"], name: "index_email_template_items_on_category"
    t.index ["email_campaign_template_id", "position"], name: "idx_on_email_campaign_template_id_position_f8c4195b8e"
    t.index ["email_campaign_template_id"], name: "index_email_template_items_on_email_campaign_template_id"
    t.index ["filter_criteria"], name: "index_email_template_items_on_filter_criteria", using: :gin
    t.check_constraint "\"position\" >= 1 AND \"position\" <= 40", name: "position_range"
  end

  create_table "email_unsubscribes", force: :cascade do |t|
    t.string "email", null: false
    t.string "scope", null: false
    t.bigint "event_id"
    t.bigint "organization_id"
    t.datetime "unsubscribed_at", null: false
    t.string "unsubscribe_source"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email", "event_id"], name: "index_email_unsubscribes_on_email_and_event_id", unique: true, where: "((scope)::text = 'event'::text)"
    t.index ["email", "organization_id"], name: "index_email_unsubscribes_on_email_and_organization_id", unique: true, where: "((scope)::text = 'organization'::text)"
    t.index ["email", "scope"], name: "index_email_unsubscribes_on_email_and_scope"
    t.index ["email"], name: "index_email_unsubscribes_on_email", unique: true, where: "((scope)::text = 'global'::text)"
    t.index ["event_id"], name: "index_email_unsubscribes_on_event_id"
    t.index ["organization_id"], name: "index_email_unsubscribes_on_organization_id"
  end

  create_table "event_invitations", force: :cascade do |t|
    t.bigint "event_id", null: false
    t.bigint "vendor_contact_id", null: false
    t.string "status", default: "pending", null: false
    t.string "invitation_token", null: false
    t.datetime "sent_at"
    t.datetime "responded_at"
    t.text "response_notes"
    t.datetime "expires_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["event_id", "vendor_contact_id"], name: "index_event_invitations_on_event_id_and_vendor_contact_id", unique: true
    t.index ["event_id"], name: "index_event_invitations_on_event_id"
    t.index ["invitation_token"], name: "index_event_invitations_on_invitation_token", unique: true
    t.index ["status"], name: "index_event_invitations_on_status"
    t.index ["vendor_contact_id"], name: "index_event_invitations_on_vendor_contact_id"
  end

  create_table "event_portals", force: :cascade do |t|
    t.bigint "event_id", null: false
    t.integer "view_count", default: 0
    t.datetime "last_viewed_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "access_token", null: false
    t.index ["access_token"], name: "index_event_portals_on_access_token", unique: true
    t.index ["event_id"], name: "index_event_portals_on_event_id", unique: true
  end

  create_table "events", force: :cascade do |t|
    t.bigint "organization_id", null: false
    t.string "title", null: false
    t.string "slug", null: false
    t.text "description"
    t.datetime "event_date"
    t.datetime "event_end_date"
    t.string "location"
    t.string "poster_url"
    t.string "ticket_url"
    t.decimal "ticket_price", precision: 8, scale: 2
    t.integer "capacity"
    t.integer "registered_count", default: 0
    t.boolean "published", default: false
    t.boolean "registration_open", default: true
    t.string "status"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.datetime "application_deadline"
    t.string "venue"
    t.string "start_time"
    t.string "end_time"
    t.string "age_restriction"
    t.string "ticket_link"
    t.bigint "email_campaign_template_id"
    t.date "payment_deadline"
    t.string "vendor_payment_link"
    t.decimal "vendor_fee_amount", precision: 10, scale: 2
    t.string "vendor_fee_currency", default: "USD"
    t.jsonb "invitation_list_ids", default: []
    t.jsonb "invitation_contact_ids", default: []
    t.jsonb "invitation_excluded_ids", default: []
    t.boolean "is_live", default: false
    t.index ["application_deadline"], name: "index_events_on_application_deadline"
    t.index ["email_campaign_template_id"], name: "index_events_on_email_campaign_template_id"
    t.index ["event_date"], name: "index_events_on_event_date"
    t.index ["organization_id"], name: "index_events_on_organization_id"
    t.index ["published"], name: "index_events_on_published"
    t.index ["slug"], name: "index_events_on_slug", unique: true
    t.index ["status"], name: "index_events_on_status"
  end

  create_table "feedbacks", force: :cascade do |t|
    t.string "name", null: false
    t.string "email", null: false
    t.integer "rating", null: false
    t.text "message", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_feedbacks_on_email"
  end

  create_table "moderation_actions", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "moderator_id", null: false
    t.bigint "report_id"
    t.string "action_type", null: false
    t.text "reason"
    t.text "details"
    t.datetime "expires_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["action_type"], name: "index_moderation_actions_on_action_type"
    t.index ["created_at"], name: "index_moderation_actions_on_created_at"
    t.index ["moderator_id"], name: "index_moderation_actions_on_moderator_id"
    t.index ["report_id"], name: "index_moderation_actions_on_report_id"
    t.index ["user_id"], name: "index_moderation_actions_on_user_id"
  end

  create_table "notifications", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "title", null: false
    t.text "body", null: false
    t.string "notification_type", null: false
    t.boolean "read", default: false, null: false
    t.json "data"
    t.bigint "activity_id"
    t.bigint "triggering_user_id"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["activity_id"], name: "index_notifications_on_activity_id"
    t.index ["notification_type"], name: "index_notifications_on_notification_type"
    t.index ["triggering_user_id"], name: "index_notifications_on_triggering_user_id"
    t.index ["user_id", "created_at"], name: "index_notifications_on_user_id_and_created_at"
    t.index ["user_id", "read"], name: "index_notifications_on_user_id_and_read"
    t.index ["user_id"], name: "index_notifications_on_user_id"
  end

  create_table "organizations", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "name", null: false
    t.string "slug", null: false
    t.text "description"
    t.string "logo_url"
    t.string "website"
    t.string "instagram_handle"
    t.string "phone"
    t.string "email"
    t.string "address"
    t.string "city"
    t.string "state"
    t.string "zip_code"
    t.decimal "latitude", precision: 10, scale: 6
    t.decimal "longitude", precision: 10, scale: 6
    t.boolean "verified", default: false
    t.boolean "active", default: true
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "eventbrite_api_token"
    t.boolean "eventbrite_connected", default: false
    t.datetime "eventbrite_connected_at"
    t.string "timezone", default: "America/Los_Angeles"
    t.index ["active"], name: "index_organizations_on_active"
    t.index ["slug"], name: "index_organizations_on_slug", unique: true
    t.index ["timezone"], name: "index_organizations_on_timezone"
    t.index ["user_id"], name: "index_organizations_on_user_id"
  end

  create_table "payment_integrations", force: :cascade do |t|
    t.bigint "event_id", null: false
    t.bigint "organization_id", null: false
    t.string "provider", null: false
    t.string "provider_event_id"
    t.string "provider_url"
    t.boolean "auto_sync_enabled", default: true
    t.boolean "auto_update_payment_status", default: true
    t.boolean "auto_send_confirmations", default: false
    t.string "sync_status", default: "active"
    t.datetime "last_synced_at"
    t.jsonb "sync_metadata", default: {}
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["event_id", "provider"], name: "index_payment_integrations_on_event_id_and_provider", unique: true
    t.index ["event_id"], name: "index_payment_integrations_on_event_id"
    t.index ["organization_id"], name: "index_payment_integrations_on_organization_id"
  end

  create_table "payment_sync_logs", force: :cascade do |t|
    t.bigint "payment_integration_id", null: false
    t.string "sync_type"
    t.integer "transactions_fetched", default: 0
    t.integer "transactions_inserted", default: 0
    t.integer "transactions_updated", default: 0
    t.integer "contacts_matched", default: 0
    t.integer "contacts_updated", default: 0
    t.integer "registrations_updated", default: 0
    t.text "error_messages"
    t.jsonb "metadata", default: {}
    t.datetime "started_at"
    t.datetime "completed_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["payment_integration_id"], name: "index_payment_sync_logs_on_payment_integration_id"
  end

  create_table "payment_transactions", force: :cascade do |t|
    t.bigint "payment_integration_id", null: false
    t.bigint "event_id", null: false
    t.bigint "vendor_contact_id"
    t.bigint "registration_id"
    t.string "provider_transaction_id", null: false
    t.string "provider", null: false
    t.string "payer_email", null: false
    t.string "payer_first_name"
    t.string "payer_last_name"
    t.string "provider_status"
    t.integer "payment_status", default: 0, null: false
    t.decimal "amount", precision: 10, scale: 2
    t.string "currency", default: "USD"
    t.datetime "transaction_created_at"
    t.datetime "transaction_updated_at"
    t.datetime "last_synced_at"
    t.datetime "payment_confirmation_sent_at"
    t.jsonb "raw_provider_data", default: {}
    t.text "notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["event_id", "payer_email"], name: "index_payment_transactions_on_event_id_and_payer_email"
    t.index ["event_id"], name: "index_payment_transactions_on_event_id"
    t.index ["payment_integration_id"], name: "index_payment_transactions_on_payment_integration_id"
    t.index ["payment_status"], name: "index_payment_transactions_on_payment_status"
    t.index ["provider_transaction_id"], name: "index_payment_transactions_on_provider_transaction_id", unique: true
    t.index ["registration_id"], name: "index_payment_transactions_on_registration_id"
    t.index ["vendor_contact_id"], name: "index_payment_transactions_on_vendor_contact_id"
  end

  create_table "pinned_activities", force: :cascade do |t|
    t.bigint "activity_id", null: false
    t.string "title"
    t.string "hours"
    t.string "price_range"
    t.string "address"
    t.integer "votes"
    t.text "description"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.text "reviews"
    t.text "photos"
    t.text "reason"
    t.string "website"
    t.boolean "selected", default: false, null: false
    t.decimal "latitude", precision: 10, scale: 6
    t.decimal "longitude", precision: 10, scale: 6
    t.index ["activity_id"], name: "index_pinned_activities_on_activity_id"
  end

  create_table "registrations", force: :cascade do |t|
    t.bigint "event_id", null: false
    t.bigint "user_id"
    t.string "email", null: false
    t.string "name"
    t.string "phone"
    t.boolean "subscribed", default: false
    t.string "ticket_code"
    t.string "qr_code_url"
    t.boolean "checked_in", default: false
    t.datetime "checked_in_at"
    t.string "status"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "vendor_application_id"
    t.string "business_name"
    t.string "vendor_category"
    t.boolean "email_unsubscribed", default: false, null: false
    t.string "instagram_handle"
    t.string "tiktok_handle"
    t.string "website"
    t.text "note_to_host"
    t.string "payment_status", default: "pending"
    t.datetime "payment_confirmed_at"
    t.bigint "payment_transaction_id"
    t.string "payment_provider"
    t.decimal "payment_amount", precision: 10, scale: 2
    t.boolean "vendor_fee_paid", default: false
    t.index ["email"], name: "index_registrations_on_email"
    t.index ["event_id"], name: "index_registrations_on_event_id"
    t.index ["payment_status"], name: "index_registrations_on_payment_status"
    t.index ["payment_transaction_id"], name: "index_registrations_on_payment_transaction_id"
    t.index ["status"], name: "index_registrations_on_status"
    t.index ["ticket_code"], name: "index_registrations_on_ticket_code", unique: true
    t.index ["user_id"], name: "index_registrations_on_user_id"
    t.index ["vendor_application_id", "status"], name: "index_registrations_on_vendor_application_id_and_status"
    t.index ["vendor_application_id"], name: "index_registrations_on_vendor_application_id"
    t.index ["vendor_category"], name: "index_registrations_on_vendor_category"
    t.index ["vendor_fee_paid"], name: "index_registrations_on_vendor_fee_paid"
  end

  create_table "reports", force: :cascade do |t|
    t.string "reportable_type", null: false
    t.bigint "reportable_id", null: false
    t.string "reason", null: false
    t.text "description"
    t.bigint "reporter_id", null: false
    t.bigint "activity_id"
    t.string "status", default: "pending", null: false
    t.datetime "reviewed_at"
    t.bigint "reviewed_by_id"
    t.string "resolution_action"
    t.text "resolution_notes"
    t.text "internal_notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["activity_id"], name: "index_reports_on_activity_id"
    t.index ["created_at"], name: "index_reports_on_created_at"
    t.index ["reason"], name: "index_reports_on_reason"
    t.index ["reportable_type", "reportable_id"], name: "index_reports_on_reportable_type_and_reportable_id"
    t.index ["reporter_id", "reportable_type", "reportable_id"], name: "index_reports_on_reporter_and_reportable", unique: true
    t.index ["reporter_id"], name: "index_reports_on_reporter_id"
    t.index ["reviewed_by_id"], name: "index_reports_on_reviewed_by_id"
    t.index ["status"], name: "index_reports_on_status"
  end

  create_table "responses", force: :cascade do |t|
    t.bigint "activity_id", null: false
    t.text "notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.jsonb "availability", default: {}, null: false
    t.string "email"
    t.text "dietary_requirements"
    t.index ["activity_id", "email"], name: "index_responses_on_activity_and_email", unique: true, where: "(email IS NOT NULL)"
    t.index ["activity_id"], name: "index_responses_on_activity_id"
    t.check_constraint "user_id IS NOT NULL OR email IS NOT NULL", name: "responses_user_or_email_present"
  end

  create_table "scheduled_emails", force: :cascade do |t|
    t.bigint "event_id", null: false
    t.bigint "email_campaign_template_id"
    t.bigint "email_template_item_id"
    t.string "name", null: false
    t.string "subject_template"
    t.text "body_template"
    t.string "trigger_type"
    t.integer "trigger_value"
    t.time "trigger_time"
    t.datetime "scheduled_for"
    t.jsonb "filter_criteria", default: {}
    t.string "status", default: "scheduled"
    t.datetime "sent_at"
    t.integer "recipient_count", default: 0
    t.text "error_message"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email_campaign_template_id"], name: "index_scheduled_emails_on_email_campaign_template_id"
    t.index ["email_template_item_id"], name: "index_scheduled_emails_on_email_template_item_id"
    t.index ["event_id", "status"], name: "index_scheduled_emails_on_event_id_and_status"
    t.index ["event_id"], name: "index_scheduled_emails_on_event_id"
    t.index ["filter_criteria"], name: "index_scheduled_emails_on_filter_criteria", using: :gin
    t.index ["status", "scheduled_for"], name: "index_scheduled_emails_on_status_and_scheduled_for"
  end

  create_table "time_slot_votes", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "time_slot_id", null: false
    t.boolean "upvote", default: true, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["time_slot_id"], name: "index_time_slot_votes_on_time_slot_id"
    t.index ["user_id", "time_slot_id"], name: "index_time_slot_votes_on_user_id_and_time_slot_id", unique: true
    t.index ["user_id"], name: "index_time_slot_votes_on_user_id"
  end

  create_table "time_slots", force: :cascade do |t|
    t.bigint "activity_id", null: false
    t.date "date", null: false
    t.time "time", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.jsonb "recommendations", default: {}
    t.index ["activity_id", "date", "time"], name: "index_time_slots_on_activity_id_and_date_and_time", unique: true
    t.index ["activity_id"], name: "index_time_slots_on_activity_id"
  end

  create_table "unsubscribe_tokens", force: :cascade do |t|
    t.string "token", null: false
    t.string "email", null: false
    t.bigint "event_id"
    t.bigint "organization_id"
    t.datetime "expires_at", null: false
    t.datetime "used_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_unsubscribe_tokens_on_email"
    t.index ["event_id"], name: "index_unsubscribe_tokens_on_event_id"
    t.index ["expires_at"], name: "index_unsubscribe_tokens_on_expires_at"
    t.index ["organization_id"], name: "index_unsubscribe_tokens_on_organization_id"
    t.index ["token"], name: "index_unsubscribe_tokens_on_token", unique: true
  end

  create_table "user_activities", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "pinned_activity_id", null: false
    t.string "title"
    t.string "hours"
    t.string "price_range"
    t.string "address"
    t.text "description"
    t.text "reason"
    t.string "website"
    t.text "reviews"
    t.text "photos"
    t.boolean "flagged", default: false, null: false
    t.boolean "favorited", default: false, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.decimal "latitude", precision: 10, scale: 6
    t.decimal "longitude", precision: 10, scale: 6
    t.index ["pinned_activity_id"], name: "index_user_activities_on_pinned_activity_id"
    t.index ["user_id", "favorited", "created_at"], name: "index_user_activities_on_community_feed"
    t.index ["user_id", "pinned_activity_id"], name: "index_user_activities_on_user_and_pinned_activity", unique: true
    t.index ["user_id"], name: "index_user_activities_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "username"
    t.string "email"
    t.string "password_digest"
    t.string "confirmation_code"
    t.datetime "confirmed_at"
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at", precision: nil
    t.string "avatar"
    t.boolean "admin", default: false
    t.string "preferences", default: "", null: false
    t.boolean "text_notifications", default: true, null: false
    t.boolean "email_notifications", default: true, null: false
    t.boolean "push_notifications", default: true, null: false
    t.string "push_token"
    t.string "platform"
    t.string "neighborhood"
    t.string "city"
    t.string "state"
    t.decimal "latitude", precision: 10, scale: 6
    t.decimal "longitude", precision: 10, scale: 6
    t.datetime "confirmation_sent_at"
    t.string "status", default: "active", null: false
    t.datetime "suspended_until"
    t.text "suspension_reason"
    t.datetime "banned_at"
    t.text "ban_reason"
    t.integer "warnings_count", default: 0, null: false
    t.integer "reports_count", default: 0, null: false
    t.datetime "terms_accepted_at"
    t.string "terms_version"
    t.datetime "privacy_policy_accepted_at"
    t.string "privacy_policy_version"
    t.datetime "community_guidelines_accepted_at"
    t.string "community_guidelines_version"
    t.string "favorite_food"
    t.string "bar_preferences"
    t.string "role", default: "consumer"
    t.string "product_context"
    t.index ["banned_at"], name: "index_users_on_banned_at"
    t.index ["city"], name: "index_users_on_city"
    t.index ["community_guidelines_accepted_at"], name: "index_users_on_community_guidelines_accepted_at"
    t.index ["latitude", "longitude"], name: "index_users_on_latitude_and_longitude"
    t.index ["privacy_policy_accepted_at"], name: "index_users_on_privacy_policy_accepted_at"
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["role"], name: "index_users_on_role"
    t.index ["state"], name: "index_users_on_state"
    t.index ["status"], name: "index_users_on_status"
    t.index ["suspended_until"], name: "index_users_on_suspended_until"
    t.index ["terms_accepted_at"], name: "index_users_on_terms_accepted_at"
  end

  create_table "vendor_applications", force: :cascade do |t|
    t.bigint "event_id", null: false
    t.string "name", null: false
    t.text "description"
    t.string "status", default: "active", null: false
    t.jsonb "categories", default: []
    t.integer "submissions_count", default: 0
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "shareable_code", null: false
    t.decimal "booth_price", precision: 8, scale: 2
    t.datetime "install_date"
    t.string "install_start_time"
    t.string "install_end_time"
    t.string "payment_link"
    t.string "application_tags"
    t.index ["created_at"], name: "index_vendor_applications_on_created_at"
    t.index ["event_id"], name: "index_vendor_applications_on_event_id"
    t.index ["shareable_code"], name: "index_vendor_applications_on_shareable_code", unique: true
    t.index ["status"], name: "index_vendor_applications_on_status"
  end

  create_table "vendor_contacts", force: :cascade do |t|
    t.bigint "organization_id", null: false
    t.bigint "vendor_id"
    t.bigint "registration_id"
    t.string "name", null: false
    t.string "email"
    t.string "phone"
    t.string "business_name"
    t.string "job_title"
    t.string "contact_type"
    t.string "status", default: "new"
    t.text "notes"
    t.jsonb "tags", default: []
    t.integer "interaction_count", default: 0
    t.datetime "last_contacted_at"
    t.string "source"
    t.datetime "imported_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "instagram_handle"
    t.string "tiktok_handle"
    t.string "website"
    t.string "location"
    t.jsonb "categories", default: []
    t.boolean "featured", default: false
    t.integer "payment_status", default: 0
    t.bigint "payment_transaction_id"
    t.string "payment_provider"
    t.decimal "payment_amount", precision: 10, scale: 2
    t.datetime "payment_date"
    t.index ["categories"], name: "index_vendor_contacts_on_categories", using: :gin
    t.index ["contact_type"], name: "index_vendor_contacts_on_contact_type"
    t.index ["created_at"], name: "index_vendor_contacts_on_created_at"
    t.index ["email"], name: "index_vendor_contacts_on_email"
    t.index ["featured"], name: "index_vendor_contacts_on_featured"
    t.index ["location"], name: "index_vendor_contacts_on_location"
    t.index ["organization_id", "status"], name: "index_vendor_contacts_on_organization_id_and_status"
    t.index ["organization_id"], name: "index_vendor_contacts_on_organization_id"
    t.index ["payment_status"], name: "index_vendor_contacts_on_payment_status"
    t.index ["payment_transaction_id"], name: "index_vendor_contacts_on_payment_transaction_id"
    t.index ["registration_id"], name: "index_vendor_contacts_on_registration_id"
    t.index ["status"], name: "index_vendor_contacts_on_status"
    t.index ["vendor_id"], name: "index_vendor_contacts_on_vendor_id"
  end

  create_table "vendors", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "name", null: false
    t.string "slug", null: false
    t.string "vendor_type", null: false
    t.text "description"
    t.string "logo_url"
    t.string "website"
    t.string "instagram_handle"
    t.string "contact_email"
    t.string "phone"
    t.json "services"
    t.json "pricing"
    t.string "address"
    t.string "city"
    t.string "state"
    t.string "zip_code"
    t.decimal "latitude", precision: 10, scale: 6
    t.decimal "longitude", precision: 10, scale: 6
    t.boolean "verified", default: false
    t.boolean "active", default: true
    t.integer "views_count", default: 0
    t.decimal "rating", precision: 3, scale: 2
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["active"], name: "index_vendors_on_active"
    t.index ["slug"], name: "index_vendors_on_slug", unique: true
    t.index ["user_id"], name: "index_vendors_on_user_id"
    t.index ["vendor_type"], name: "index_vendors_on_vendor_type"
    t.index ["verified"], name: "index_vendors_on_verified"
  end

  create_table "votes", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.bigint "pinned_activity_id", null: false
    t.boolean "upvote"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["pinned_activity_id"], name: "index_votes_on_pinned_activity_id"
    t.index ["user_id"], name: "index_votes_on_user_id"
  end

  create_table "waitlists", force: :cascade do |t|
    t.string "name"
    t.string "email"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.boolean "product", default: false, null: false
    t.boolean "mobile", default: false, null: false
  end

  add_foreign_key "active_storage_attachments", "active_storage_blobs", column: "blob_id"
  add_foreign_key "active_storage_variant_records", "active_storage_blobs", column: "blob_id"
  add_foreign_key "activities", "users"
  add_foreign_key "activity_participants", "activities"
  add_foreign_key "activity_participants", "users"
  add_foreign_key "blocked_users", "users", column: "blocked_id"
  add_foreign_key "blocked_users", "users", column: "blocker_id"
  add_foreign_key "budget_line_items", "budgets"
  add_foreign_key "budget_line_items", "vendors"
  add_foreign_key "budgets", "users"
  add_foreign_key "bulletin_reads", "bulletins"
  add_foreign_key "bulletin_reads", "users"
  add_foreign_key "bulletins", "events"
  add_foreign_key "bulletins", "users", column: "author_id"
  add_foreign_key "comments", "pinned_activities"
  add_foreign_key "comments", "users"
  add_foreign_key "contact_lists", "organizations"
  add_foreign_key "contacts", "payment_transactions"
  add_foreign_key "email_campaign_templates", "organizations"
  add_foreign_key "email_deliveries", "event_invitations"
  add_foreign_key "email_deliveries", "events"
  add_foreign_key "email_deliveries", "registrations"
  add_foreign_key "email_deliveries", "scheduled_emails"
  add_foreign_key "email_template_items", "email_campaign_templates"
  add_foreign_key "email_unsubscribes", "events"
  add_foreign_key "email_unsubscribes", "organizations"
  add_foreign_key "event_invitations", "events"
  add_foreign_key "event_invitations", "vendor_contacts"
  add_foreign_key "event_portals", "events"
  add_foreign_key "events", "email_campaign_templates"
  add_foreign_key "events", "organizations"
  add_foreign_key "moderation_actions", "reports"
  add_foreign_key "moderation_actions", "users"
  add_foreign_key "moderation_actions", "users", column: "moderator_id"
  add_foreign_key "notifications", "activities"
  add_foreign_key "notifications", "users"
  add_foreign_key "notifications", "users", column: "triggering_user_id"
  add_foreign_key "organizations", "users"
  add_foreign_key "payment_integrations", "events"
  add_foreign_key "payment_integrations", "organizations"
  add_foreign_key "payment_sync_logs", "payment_integrations"
  add_foreign_key "payment_transactions", "events"
  add_foreign_key "payment_transactions", "payment_integrations"
  add_foreign_key "payment_transactions", "registrations"
  add_foreign_key "payment_transactions", "vendor_contacts"
  add_foreign_key "pinned_activities", "activities"
  add_foreign_key "registrations", "events"
  add_foreign_key "registrations", "payment_transactions"
  add_foreign_key "registrations", "users"
  add_foreign_key "registrations", "vendor_applications"
  add_foreign_key "reports", "activities"
  add_foreign_key "reports", "users", column: "reporter_id"
  add_foreign_key "reports", "users", column: "reviewed_by_id"
  add_foreign_key "responses", "activities"
  add_foreign_key "responses", "users", on_delete: :cascade
  add_foreign_key "scheduled_emails", "email_campaign_templates"
  add_foreign_key "scheduled_emails", "email_template_items"
  add_foreign_key "scheduled_emails", "events"
  add_foreign_key "time_slot_votes", "time_slots"
  add_foreign_key "time_slot_votes", "users"
  add_foreign_key "time_slots", "activities"
  add_foreign_key "unsubscribe_tokens", "events"
  add_foreign_key "unsubscribe_tokens", "organizations"
  add_foreign_key "user_activities", "pinned_activities"
  add_foreign_key "user_activities", "users"
  add_foreign_key "vendor_applications", "events"
  add_foreign_key "vendor_contacts", "organizations"
  add_foreign_key "vendor_contacts", "payment_transactions"
  add_foreign_key "vendor_contacts", "registrations"
  add_foreign_key "vendor_contacts", "vendors"
  add_foreign_key "vendors", "users"
  add_foreign_key "votes", "pinned_activities"
  add_foreign_key "votes", "users"
end
