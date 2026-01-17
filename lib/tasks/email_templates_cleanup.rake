namespace :email_templates do
  desc "Clean up old email template structure (remove positions 8-16, keep only 1-7)"
  task cleanup_old_structure: :environment do
    puts "\n🧹 Cleaning up old email template structure...\n"

    template = EmailCampaignTemplate.find_by(template_type: 'system', is_default: true)

    unless template
      puts "❌ No default template found"
      exit 1
    end

    puts "Found template: #{template.name} (ID: #{template.id})"
    puts "Current items count: #{template.email_template_items.count}"
    puts ""

    # Find items with positions 8-16 (old structure)
    old_items = template.email_template_items.where("position > 7").order(:position)

    if old_items.empty?
      puts "✅ Template already clean (only 7 positions)"
      exit 0
    end

    puts "Found #{old_items.count} old template items to remove:\n"
    old_items.each do |item|
      puts "  Position #{item.position}: #{item.name}"
      puts "    Subject: #{item.subject_template}"
    end

    puts "\n⚠️  WARNING: This will delete these #{old_items.count} template items."
    puts "⚠️  Any scheduled emails already created from these items will be DETACHED."
    puts "⚠️  Those scheduled emails will still send, but won't be linked to template items.\n"

    print "Continue? (yes/no): "
    confirmation = STDIN.gets.chomp

    unless confirmation.downcase == 'yes'
      puts "Aborted."
      exit 0
    end

    # Delete old items
    deleted_count = 0
    old_items.each do |item|
      # Update any scheduled_emails that reference this item to have null email_template_item_id
      # This preserves the scheduled email but detaches it from the template item
      ScheduledEmail.where(email_template_item_id: item.id).update_all(email_template_item_id: nil)

      item.destroy
      puts "  ✅ Deleted Position #{item.position}: #{item.name}"
      deleted_count += 1
    end

    template.touch # Update timestamp

    puts "\n✅ Successfully deleted #{deleted_count} old template items"
    puts "Remaining items: #{template.email_template_items.count}"
    puts "\nTemplate now has positions 1-7 only (emoji-free):"

    template.email_template_items.order(:position).each do |item|
      puts "  #{item.position}. #{item.name}"
      puts "     Subject: #{item.subject_template}"
    end

    puts "\n✅ Cleanup complete!"
    puts "\nNext steps:"
    puts "  1. New events will now use only the 7 emoji-free emails"
    puts "  2. Existing events with old emails will still send (preserved)"
    puts "  3. Run 'rails email_templates:show_default' to verify\n"
  end

  desc "Show count of scheduled emails using old template items"
  task show_old_scheduled_emails: :environment do
    template = EmailCampaignTemplate.find_by(template_type: 'system', is_default: true)

    unless template
      puts "❌ No default template found"
      exit 1
    end

    old_items = template.email_template_items.where("position > 7")

    if old_items.empty?
      puts "✅ No old template items found"
      exit 0
    end

    puts "\n📊 Scheduled Emails Using Old Template Items (positions 8-16):\n"

    old_items.order(:position).each do |item|
      count = ScheduledEmail.where(email_template_item_id: item.id).count
      scheduled_count = ScheduledEmail.where(email_template_item_id: item.id, status: 'scheduled').count

      puts "  Position #{item.position}: #{item.name}"
      puts "    Total scheduled emails: #{count}"
      puts "    Still pending (not sent): #{scheduled_count}"
      puts ""
    end
  end
end
