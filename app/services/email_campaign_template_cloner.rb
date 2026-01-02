# Service to clone email campaign templates for customization
#
# Usage:
#   # Clone system template for an organization
#   cloner = EmailCampaignTemplateCloner.new(source_template, organization)
#   new_template = cloner.clone
#
#   # Clone with custom name
#   new_template = cloner.clone(name: "Summer Events Campaign")
#
# This service:
# 1. Creates a new 'user' template owned by the organization
# 2. Copies all email template items with their settings
# 3. Maintains position order and categories
# 4. Allows customization after cloning

class EmailCampaignTemplateCloner
  attr_reader :source_template, :organization, :errors

  def initialize(source_template, organization)
    @source_template = source_template
    @organization = organization
    @errors = []
  end

  # Clone the template with all its email items
  # Options:
  #   name: Custom name for the cloned template (default: "Copy of [source name]")
  #   description: Custom description
  #   include_disabled: Include disabled email items (default: false)
  def clone(options = {})
    ActiveRecord::Base.transaction do
      # Create the new template
      new_template = create_template(options)

      # Copy all email items
      copy_email_items(new_template, options)

      new_template
    rescue ActiveRecord::RecordInvalid => e
      @errors << e.message
      raise ActiveRecord::Rollback
    end
  end

  # Clone only specific categories
  # categories: array of category names, e.g., ["event_announcements", "payment_reminders"]
  def clone_selective(categories:, name: nil)
    ActiveRecord::Base.transaction do
      new_template = create_template(name: name)

      source_template.email_template_items
        .where(category: categories)
        .by_position
        .each_with_index do |item, index|
          clone_email_item(item, new_template, position: index + 1)
        end

      new_template
    rescue ActiveRecord::RecordInvalid => e
      @errors << e.message
      raise ActiveRecord::Rollback
    end
  end

  # Check if organization can clone this template
  def can_clone?
    # Can clone system templates or own templates
    return true if source_template.template_type == "system"
    return true if source_template.organization_id == organization.id

    false
  end

  private

  def create_template(options = {})
    name = options[:name] || "Copy of #{source_template.name}"
    description = options[:description] || source_template.description

    EmailCampaignTemplate.create!(
      template_type: "user",
      organization: organization,
      name: name,
      description: description,
      is_default: false
    )
  end

  def copy_email_items(new_template, options)
    include_disabled = options[:include_disabled] || false

    items = source_template.email_template_items.by_position
    items = items.enabled unless include_disabled

    items.each do |item|
      clone_email_item(item, new_template)
    end
  end

  def clone_email_item(source_item, new_template, position: nil)
    EmailTemplateItem.create!(
      email_campaign_template: new_template,
      name: source_item.name,
      category: source_item.category,
      position: position || source_item.position,
      subject_template: source_item.subject_template,
      body_template: source_item.body_template,
      trigger_type: source_item.trigger_type,
      trigger_value: source_item.trigger_value,
      trigger_time: source_item.trigger_time,
      filter_criteria: source_item.filter_criteria,
      enabled_by_default: source_item.enabled_by_default
    )
  end
end
