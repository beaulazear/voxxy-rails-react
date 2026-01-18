class ContactList < ApplicationRecord
  belongs_to :organization

  validates :name, presence: true, uniqueness: { scope: :organization_id }
  validates :list_type, inclusion: { in: %w[smart manual] }

  # For smart lists, ensure filters is valid JSON
  validate :validate_filters, if: -> { list_type == "smart" }

  # For manual lists, ensure contact_ids are valid
  validate :validate_contact_ids, if: -> { list_type == "manual" }

  scope :smart_lists, -> { where(list_type: "smart") }
  scope :manual_lists, -> { where(list_type: "manual") }
  scope :recent, -> { order(updated_at: :desc) }

  # Resolve list to actual contacts
  def contacts
    if smart?
      resolve_smart_list
    else
      resolve_manual_list
    end
  end

  def smart?
    list_type == "smart"
  end

  def manual?
    list_type == "manual"
  end

  # Update the contacts count cache
  def update_contacts_count!
    update!(contacts_count: contacts.count)
  end

  private

  def resolve_smart_list
    scope = organization.vendor_contacts

    # Apply category filter
    if filters["categories"].present?
      filters["categories"].each do |category|
        scope = scope.by_category(category)
      end
    end

    # Apply location filter
    if filters["locations"].present?
      scope = scope.where(location: filters["locations"])
    end

    # Apply tags filter
    if filters["tags"].present?
      filters["tags"].each do |tag|
        scope = scope.where("tags @> ?", [ tag ].to_json)
      end
    end

    scope
  end

  def resolve_manual_list
    organization.vendor_contacts.where(id: contact_ids)
  end

  def validate_filters
    unless filters.is_a?(Hash)
      errors.add(:filters, "must be a valid hash")
    end
  end

  def validate_contact_ids
    unless contact_ids.is_a?(Array)
      errors.add(:contact_ids, "must be an array")
    end
  end
end
