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

ActiveRecord::Schema[7.2].define(version: 2025_10_21_213850) do
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

  create_table "bug_reports", force: :cascade do |t|
    t.string "name", null: false
    t.string "email", null: false
    t.text "bug_description", null: false
    t.text "steps_to_reproduce"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_bug_reports_on_email"
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

  create_table "contacts", force: :cascade do |t|
    t.string "name", null: false
    t.string "email", null: false
    t.string "subject", null: false
    t.text "message", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_contacts_on_email"
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
    t.index ["activity_id", "email"], name: "index_responses_on_activity_and_email", unique: true, where: "(email IS NOT NULL)"
    t.index ["activity_id"], name: "index_responses_on_activity_id"
    t.check_constraint "user_id IS NOT NULL OR email IS NOT NULL", name: "responses_user_or_email_present"
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
    t.index ["banned_at"], name: "index_users_on_banned_at"
    t.index ["city"], name: "index_users_on_city"
    t.index ["community_guidelines_accepted_at"], name: "index_users_on_community_guidelines_accepted_at"
    t.index ["latitude", "longitude"], name: "index_users_on_latitude_and_longitude"
    t.index ["privacy_policy_accepted_at"], name: "index_users_on_privacy_policy_accepted_at"
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
    t.index ["state"], name: "index_users_on_state"
    t.index ["status"], name: "index_users_on_status"
    t.index ["suspended_until"], name: "index_users_on_suspended_until"
    t.index ["terms_accepted_at"], name: "index_users_on_terms_accepted_at"
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
  add_foreign_key "comments", "pinned_activities"
  add_foreign_key "comments", "users"
  add_foreign_key "moderation_actions", "reports"
  add_foreign_key "moderation_actions", "users"
  add_foreign_key "moderation_actions", "users", column: "moderator_id"
  add_foreign_key "notifications", "activities"
  add_foreign_key "notifications", "users"
  add_foreign_key "notifications", "users", column: "triggering_user_id"
  add_foreign_key "pinned_activities", "activities"
  add_foreign_key "reports", "activities"
  add_foreign_key "reports", "users", column: "reporter_id"
  add_foreign_key "reports", "users", column: "reviewed_by_id"
  add_foreign_key "responses", "activities"
  add_foreign_key "responses", "users", on_delete: :cascade
  add_foreign_key "time_slot_votes", "time_slots"
  add_foreign_key "time_slot_votes", "users"
  add_foreign_key "time_slots", "activities"
  add_foreign_key "user_activities", "pinned_activities"
  add_foreign_key "user_activities", "users"
  add_foreign_key "votes", "pinned_activities"
  add_foreign_key "votes", "users"
end
