class Bulletin < ApplicationRecord
  # Associations
  belongs_to :event
  belongs_to :author, class_name: "User"
  has_many :bulletin_reads, dependent: :destroy

  # Validations
  validates :subject, presence: true
  validates :body, presence: true
  validates :bulletin_type, inclusion: { in: %w[announcement update reminder] }, allow_blank: true

  # Scopes
  scope :pinned, -> { where(pinned: true) }
  scope :recent, -> { order(created_at: :desc) }
  scope :for_display, -> { order(Arel.sql("pinned DESC, created_at DESC")) }

  # Instance methods
  def read_by?(user_or_email)
    if user_or_email.is_a?(User)
      bulletin_reads.exists?(user_id: user_or_email.id)
    elsif user_or_email.is_a?(String)
      bulletin_reads.exists?(registration_email: user_or_email.downcase)
    else
      false
    end
  end

  def mark_read_by(user_or_email)
    if user_or_email.is_a?(User)
      bulletin_reads.find_or_create_by(user_id: user_or_email.id) do |read|
        read.read_at = Time.current
      end
    elsif user_or_email.is_a?(String)
      bulletin_reads.find_or_create_by(registration_email: user_or_email.downcase) do |read|
        read.read_at = Time.current
      end
    end
  end

  def read_count
    bulletin_reads.count
  end
end
