namespace :diagnose do
  desc "Diagnose reply-to email issue"
  task reply_to: :environment do
    puts "=" * 80
    puts "REPLY-TO EMAIL DIAGNOSTIC SCRIPT"
    puts "=" * 80
    puts ""

    # Step 1: Check if Organization model has the reply_to_email method
    puts "1. Checking Organization model..."
    org_method = Organization.instance_methods.include?(:reply_to_email)
    puts "   reply_to_email method exists: #{org_method ? '✅ YES' : '❌ NO'}"

    if org_method
      # Show the method source location
      begin
        method_source = Organization.instance_method(:reply_to_email).source_location
        puts "   Method defined in: #{method_source[0]}:#{method_source[1]}"
      rescue
        puts "   (Cannot determine source location)"
      end
    end
    puts ""

    # Step 2: Test reply_to_email for all organizations
    puts "2. Testing reply_to_email for all organizations..."
    puts ""

    Organization.includes(:user).find_each do |org|
      puts "   Organization: #{org.name} (ID: #{org.id})"
      puts "      org.email: #{org.email.inspect}"
      puts "      user.email: #{org.user&.email.inspect}"

      if org_method
        reply_email = org.reply_to_email
        reply_name = org.reply_to_name
        puts "      reply_to_email: #{reply_email.inspect}"
        puts "      reply_to_name: #{reply_name.inspect}"

        # Validate the email
        if reply_email.nil? || reply_email.empty?
          puts "      ⚠️  WARNING: reply_to_email is blank!"
        elsif reply_email == "noreply@voxxypresents.com"
          puts "      ❌ ERROR: reply_to_email is noreply (should never happen!)"
        elsif reply_email == "support@voxxypresents.com"
          puts "      ⚠️  FALLBACK: Using support email (org and user emails missing)"
        else
          puts "      ✅ OK: Valid reply-to email"
        end
      end
      puts ""
    end

    # Step 3: Check recent events
    puts "3. Checking recent events..."
    puts ""

    Event.includes(organization: :user).order(created_at: :desc).limit(5).each do |event|
      org = event.organization
      puts "   Event: #{event.title} (ID: #{event.id})"
      puts "      Organization: #{org.name}"
      puts "      Org Email: #{org.email.inspect}"
      puts "      User Email: #{org.user&.email.inspect}"
      puts "      reply_to_email: #{org.reply_to_email.inspect}" if org_method
      puts ""
    end

    # Step 4: Test EventInvitationMailer
    puts "4. Checking EventInvitationMailer implementation..."

    # Check if the mailer file contains 'reply_to'
    mailer_file = Rails.root.join("app", "mailers", "event_invitation_mailer.rb")
    if File.exist?(mailer_file)
      content = File.read(mailer_file)
      has_reply_to = content.include?("reply_to:")
      puts "   EventInvitationMailer has reply_to: #{has_reply_to ? '✅ YES' : '❌ NO'}"

      if has_reply_to
        # Find the reply_to line
        reply_to_line = content.lines.find { |line| line.include?("reply_to:") }
        puts "   Reply-to line: #{reply_to_line.strip}" if reply_to_line
      end
    else
      puts "   ❌ EventInvitationMailer not found"
    end
    puts ""

    # Step 5: Summary
    puts "=" * 80
    puts "SUMMARY"
    puts "=" * 80

    if !org_method
      puts "❌ ISSUE: Organization model does not have reply_to_email method"
      puts "   ACTION: The code changes have not been deployed to this environment yet."
      puts "   SOLUTION: Redeploy the application to pull the latest code."
    elsif Organization.where.not(email: nil).exists? || Organization.joins(:user).where.not(users: { email: nil }).exists?
      puts "✅ Organization model has reply_to_email method"
      puts "✅ Organizations have valid emails"
      puts ""
      puts "If you're still seeing noreply@voxxypresents.com in reply-to headers:"
      puts "   1. The email you're looking at was sent BEFORE the deployment"
      puts "   2. Clear your email cache and send a new test email"
      puts "   3. Check the email headers carefully (not just the 'from' field)"
    else
      puts "⚠️  WARNING: No organizations have emails set"
      puts "   ACTION: Set organization emails or verify users have emails"
    end

    puts ""
    puts "=" * 80
  end
end
