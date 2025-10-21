class User < ApplicationRecord
  has_secure_password
  has_many :activities, dependent: :destroy
  has_many :activity_participants, dependent: :destroy
  has_many :joined_activities, through: :activity_participants, source: :activity
  has_many :comments, dependent: :destroy
  has_many :votes, dependent: :destroy
  has_many :user_activities, dependent: :destroy
  has_many :notifications, dependent: :destroy
  has_many :triggered_notifications, class_name: "Notification", foreign_key: "triggering_user_id", dependent: :nullify

  # Moderation associations
  has_many :reports_as_reporter, class_name: "Report", foreign_key: "reporter_id", dependent: :destroy
  has_many :reports_as_subject, -> { where(reportable_type: "User") },
           class_name: "Report", foreign_key: "reportable_id", dependent: :destroy
  has_many :moderation_actions, dependent: :destroy
  has_many :administered_moderation_actions, class_name: "ModerationAction", foreign_key: "moderator_id", dependent: :nullify

  # Blocking associations
  has_many :blocked_user_relationships, class_name: "BlockedUser", foreign_key: "blocker_id", dependent: :destroy
  has_many :blocked_users, through: :blocked_user_relationships, source: :blocked
  has_many :blocked_by_relationships, class_name: "BlockedUser", foreign_key: "blocked_id", dependent: :destroy
  has_many :blocked_by_users, through: :blocked_by_relationships, source: :blocker

  before_create :generate_confirmation_code

  validates :name, presence: true
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :password, presence: true, length: { minimum: 6 }, if: -> { new_record? || !password.nil? }
  validates :password_confirmation, presence: true, if: -> { password.present? }

  before_validation :set_defaults_for_notifications, on: :create

  has_one_attached :profile_pic

  # Add this method to get the profile picture URL
  def profile_pic_url
    if profile_pic.attached?
      Rails.application.routes.url_helpers.rails_blob_url(profile_pic, only_path: true)
    else
      nil
    end
  end

  # Optional: method to get display image (profile_pic or fallback to avatar)
  def display_image_url
    profile_pic_url || avatar
  end

  def verify!
    update_columns(confirmed_at: Time.current, confirmation_code: nil, confirmation_sent_at: nil)
  end

  def generate_password_reset_token
    self.reset_password_token = SecureRandom.hex(10)
    self.reset_password_sent_at = Time.current
    save!(validate: false)
  end

  def password_reset_token_valid?
    reset_password_sent_at > 24.hours.ago
  end

  def reset_password!(new_password)
    self.reset_password_token = nil
    self.reset_password_sent_at = nil
    self.password = new_password
    self.password_confirmation = new_password
    save!
  end

  def can_receive_push_notifications?
    push_notifications && push_token.present?
  end

  def location_complete?
    city.present? && state.present?
  end

  def full_location
    return nil unless location_complete?

    parts = []
    parts << neighborhood if neighborhood.present?
    parts << city
    parts << state
    parts.join(", ")
  end

  def coordinates
    return nil unless latitude.present? && longitude.present?
    { lat: latitude, lng: longitude }
  end

  def confirmation_code_valid?
    confirmation_sent_at && confirmation_sent_at > 24.hours.ago
  end

  def generate_new_confirmation_code!
    self.confirmation_code = generate_6_digit_code
    self.confirmation_sent_at = Time.current
    save!(validate: false)
  end

  # Moderation methods
  def active?
    status == "active"
  end

  def suspended?
    status == "suspended" || (suspended_until.present? && suspended_until > Time.current)
  end

  def banned?
    status == "banned" || banned_at.present?
  end

  def can_login?
    active? && !suspended? && !banned?
  end

  def suspend!(duration, reason, moderator = nil)
    transaction do
      update!(
        status: "suspended",
        suspended_until: Time.current + duration,
        suspension_reason: reason
      )

      if moderator
        ModerationAction.log_action(
          user: self,
          moderator: moderator,
          action: "suspended",
          reason: reason,
          expires_at: suspended_until
        )
      end
    end
  end

  def unsuspend!(moderator = nil)
    transaction do
      update!(
        status: "active",
        suspended_until: nil,
        suspension_reason: nil
      )

      if moderator
        ModerationAction.log_action(
          user: self,
          moderator: moderator,
          action: "unbanned",
          reason: "Suspension lifted"
        )
      end
    end
  end

  def ban!(reason, moderator = nil)
    transaction do
      update!(
        status: "banned",
        banned_at: Time.current,
        ban_reason: reason
      )

      if moderator
        ModerationAction.log_action(
          user: self,
          moderator: moderator,
          action: "banned",
          reason: reason
        )
      end
    end
  end

  # Blocking methods
  def block!(user_to_block)
    return false if id == user_to_block.id
    blocked_user_relationships.create!(blocked: user_to_block)
    true
  rescue ActiveRecord::RecordInvalid
    false
  end

  def unblock!(user_to_unblock)
    blocked_user_relationships.find_by(blocked: user_to_unblock)&.destroy
  end

  def blocking?(user)
    blocked_users.exists?(user.id)
  end

  def blocked_by?(user)
    blocked_by_users.exists?(user.id)
  end

  # Terms and Privacy acceptance methods
  CURRENT_TERMS_VERSION = "1.0.0"
  CURRENT_PRIVACY_VERSION = "1.0.0"
  CURRENT_GUIDELINES_VERSION = "1.0.0"

  def accept_terms!(version = CURRENT_TERMS_VERSION)
    update!(
      terms_accepted_at: Time.current,
      terms_version: version
    )
  end

  def accept_privacy_policy!(version = CURRENT_PRIVACY_VERSION)
    update!(
      privacy_policy_accepted_at: Time.current,
      privacy_policy_version: version
    )
  end

  def accept_community_guidelines!(version = CURRENT_GUIDELINES_VERSION)
    update!(
      community_guidelines_accepted_at: Time.current,
      community_guidelines_version: version
    )
  end

  def accept_all_policies!(terms_version = CURRENT_TERMS_VERSION,
                          privacy_version = CURRENT_PRIVACY_VERSION,
                          guidelines_version = CURRENT_GUIDELINES_VERSION)
    update!(
      terms_accepted_at: Time.current,
      terms_version: terms_version,
      privacy_policy_accepted_at: Time.current,
      privacy_policy_version: privacy_version,
      community_guidelines_accepted_at: Time.current,
      community_guidelines_version: guidelines_version
    )
  end

  def has_accepted_terms?
    terms_accepted_at.present? && terms_version == CURRENT_TERMS_VERSION
  end

  def has_accepted_privacy_policy?
    privacy_policy_accepted_at.present? && privacy_policy_version == CURRENT_PRIVACY_VERSION
  end

  def has_accepted_community_guidelines?
    community_guidelines_accepted_at.present? && community_guidelines_version == CURRENT_GUIDELINES_VERSION
  end

  def has_accepted_all_policies?
    has_accepted_terms? && has_accepted_privacy_policy? && has_accepted_community_guidelines?
  end

  def needs_to_accept_updated_policies?
    !has_accepted_all_policies?
  end

  # Check if user has saved preferences/favorites
  def has_saved_preferences?
    preferences.present? || favorite_food.present?
  end

  # Generate notes from user's saved preferences
  def generate_preference_notes
    notes = []
    notes << "Favorite food: #{favorite_food}" if favorite_food.present?
    notes << preferences if preferences.present?
    notes.join("\n")
  end

  # Get all unique users this user has done activities with (community members)
  def community_member_ids
    # Activities created by this user - get all participants
    hosted_activity_participant_ids = Activity
      .where(user_id: id)
      .joins(:activity_participants)
      .where(activity_participants: { accepted: true })
      .where.not(activity_participants: { user_id: [ nil, id ] })
      .pluck("activity_participants.user_id")

    # Activities where this user participated - get host + other participants
    participated_activity_ids = activity_participants
      .where(accepted: true)
      .pluck(:activity_id)

    if participated_activity_ids.any?
      # Get other participants from activities this user joined
      participated_other_participants = ActivityParticipant
        .where(activity_id: participated_activity_ids, accepted: true)
        .where.not(user_id: [ nil, id ])
        .pluck(:user_id)

      # Get hosts of activities this user joined
      participated_hosts = Activity
        .where(id: participated_activity_ids)
        .where.not(user_id: id)
        .pluck(:user_id)

      # Combine all and remove duplicates
      all_member_ids = (hosted_activity_participant_ids + participated_other_participants + participated_hosts).uniq
    else
      all_member_ids = hosted_activity_participant_ids.uniq
    end

    # Exclude blocked users
    blocked_user_ids = blocked_users.pluck(:id)
    all_member_ids - blocked_user_ids
  end

  def unban!(moderator = nil)
    transaction do
      update!(
        status: "active",
        banned_at: nil,
        ban_reason: nil
      )

      if moderator
        ModerationAction.log_action(
          user: self,
          moderator: moderator,
          action: "unbanned",
          reason: "Ban lifted"
        )
      end
    end
  end

  def check_suspension_expiry
    if suspended? && suspended_until.present? && suspended_until <= Time.current
      unsuspend!
    end
  end

  private

  def generate_confirmation_code
    self.confirmation_code = generate_6_digit_code unless self.confirmed_at
    self.confirmation_sent_at = Time.current unless self.confirmed_at
  end

  def generate_6_digit_code
    rand(100000..999999).to_s
  end

  def set_defaults_for_notifications
    self.preferences ||= ""
    self.text_notifications = true if text_notifications.nil?
    self.email_notifications = true if email_notifications.nil?
    self.push_notifications = true if push_notifications.nil?
  end
end
