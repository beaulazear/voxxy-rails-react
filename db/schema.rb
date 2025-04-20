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

ActiveRecord::Schema[7.2].define(version: 2025_04_18_205547) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "activities", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "activity_name"
    t.string "activity_location"
    t.integer "group_size"
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
    t.index ["user_id"], name: "index_activities_on_user_id"
  end

  create_table "activity_participants", force: :cascade do |t|
    t.bigint "user_id"
    t.bigint "activity_id", null: false
    t.string "invited_email"
    t.boolean "accepted", default: false, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["activity_id"], name: "index_activity_participants_on_activity_id"
    t.index ["user_id"], name: "index_activity_participants_on_user_id"
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
    t.index ["activity_id"], name: "index_pinned_activities_on_activity_id"
  end

  create_table "responses", force: :cascade do |t|
    t.bigint "activity_id", null: false
    t.text "notes"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.bigint "user_id"
    t.index ["activity_id"], name: "index_responses_on_activity_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "name"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "username"
    t.string "email"
    t.string "password_digest"
    t.string "confirmation_token"
    t.datetime "confirmed_at"
    t.string "reset_password_token"
    t.datetime "reset_password_sent_at", precision: nil
    t.string "avatar"
    t.index ["reset_password_token"], name: "index_users_on_reset_password_token", unique: true
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

  add_foreign_key "activities", "users"
  add_foreign_key "activity_participants", "activities"
  add_foreign_key "activity_participants", "users"
  add_foreign_key "comments", "pinned_activities"
  add_foreign_key "comments", "users"
  add_foreign_key "pinned_activities", "activities"
  add_foreign_key "responses", "activities"
  add_foreign_key "responses", "users", on_delete: :cascade
  add_foreign_key "votes", "pinned_activities"
  add_foreign_key "votes", "users"
end
