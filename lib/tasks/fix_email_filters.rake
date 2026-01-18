namespace :email do
  desc "Fix filter_criteria for existing scheduled emails"
  task fix_filters: :environment do
    puts ""
    puts "=" * 80
    puts "🔧 FIXING FILTER CRITERIA FOR EXISTING SCHEDULED EMAILS"
    puts "=" * 80
    puts ""

    updated_count = 0
    skipped_count = 0

    # Find all scheduled emails that haven't been sent yet
    ScheduledEmail.where(status: [ "scheduled", "paused" ]).find_each do |email|
      old_criteria = email.filter_criteria
      new_criteria = old_criteria.deep_dup

      changed = false

      # Fix 1: Application deadline emails with empty filter_criteria
      if (email.name.include?("Application Deadline") || email.name.include?("Before Application")) &&
         (old_criteria.nil? || old_criteria.empty?)
        new_criteria = { "statuses" => [ "pending" ] }
        changed = true
        puts "📧 #{email.name} (ID: #{email.id})"
        puts "   Old: #{old_criteria.inspect}"
        puts "   New: #{new_criteria.inspect}"
      end

      # Fix 2: Convert singular 'status' to plural 'statuses'
      if old_criteria.is_a?(Hash) && old_criteria["status"].present? && old_criteria["statuses"].nil?
        new_criteria["statuses"] = old_criteria.delete("status")
        changed = true
        puts "📧 #{email.name} (ID: #{email.id})"
        puts "   Changed 'status' → 'statuses'"
      end

      # Fix 3: Convert singular 'vendor_category' to plural (if present)
      if old_criteria.is_a?(Hash) && old_criteria["vendor_category"].present? && old_criteria["vendor_categories"].nil?
        new_criteria["vendor_categories"] = old_criteria.delete("vendor_category")
        changed = true
        puts "   Changed 'vendor_category' → 'vendor_categories'"
      end

      if changed
        email.update!(filter_criteria: new_criteria)
        puts "   ✅ Updated"
        puts ""
        updated_count += 1
      else
        skipped_count += 1
      end
    end

    puts "=" * 80
    puts "✅ DONE!"
    puts "=" * 80
    puts ""
    puts "📊 SUMMARY:"
    puts "   Updated: #{updated_count} scheduled emails"
    puts "   Skipped: #{skipped_count} (already correct)"
    puts ""
  end
end
