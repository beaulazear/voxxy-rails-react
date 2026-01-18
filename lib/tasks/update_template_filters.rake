namespace :email_templates do
  desc "Update filter_criteria on default email campaign template items"
  task update_filters: :environment do
    puts ""
    puts "=" * 80
    puts "🔧 UPDATING FILTER CRITERIA ON EMAIL TEMPLATE ITEMS"
    puts "=" * 80
    puts ""

    # Find the default template
    template = EmailCampaignTemplate.find_by(template_type: "system", is_default: true)

    unless template
      puts "❌ No default template found. Run 'rails db:seed' first."
      exit 1
    end

    puts "Found default template: #{template.name} (ID: #{template.id})"
    puts ""

    updated_count = 0

    # Update filter_criteria for each email type
    filter_updates = [
      {
        position: 1,
        name: "1 Day Before Application Deadline",
        filter_criteria: { "statuses" => [ "pending" ] }
      },
      {
        position: 2,
        name: "Application Deadline Day",
        filter_criteria: { "statuses" => [ "pending" ] }
      },
      {
        position: 3,
        name: "1 Day Before Payment Due",
        filter_criteria: { "statuses" => [ "approved" ], "payment_status" => [ "pending", "overdue" ] }
      },
      {
        position: 4,
        name: "Payment Due Today",
        filter_criteria: { "statuses" => [ "approved" ], "payment_status" => [ "pending", "overdue" ] }
      },
      {
        position: 5,
        name: "1 Day Before Event",
        filter_criteria: { "statuses" => [ "approved", "confirmed" ] }
      },
      {
        position: 6,
        name: "Day of Event",
        filter_criteria: { "statuses" => [ "approved", "confirmed" ] }
      },
      {
        position: 7,
        name: "Day After Event - Thank You",
        filter_criteria: { "statuses" => [ "approved", "confirmed" ] }
      }
    ]

    filter_updates.each do |update|
      item = template.email_template_items.find_by(position: update[:position])

      if item
        old_criteria = item.filter_criteria
        item.update!(filter_criteria: update[:filter_criteria])

        puts "📧 Position #{update[:position]}: #{update[:name]}"
        puts "   Old: #{old_criteria.inspect}"
        puts "   New: #{update[:filter_criteria].inspect}"
        puts "   ✅ Updated"
        puts ""

        updated_count += 1
      else
        puts "⚠️  Position #{update[:position]} not found"
        puts ""
      end
    end

    # Update the template's timestamp
    template.touch

    puts "=" * 80
    puts "✅ DONE!"
    puts "=" * 80
    puts ""
    puts "Updated #{updated_count}/#{filter_updates.count} email template items"
    puts ""
    puts "Next step: Update scheduled emails with:"
    puts "  bundle exec rake email:fix_filters"
    puts ""
  end
end
