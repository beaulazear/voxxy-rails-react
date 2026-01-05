# db/seeds.rb
#
# This file should contain seed data for development/test environments.
#
# SECURITY NOTE: Never commit real credentials to this file.
# Admin users should be created manually or via secure environment variables.
#
# Example usage:
#   rails db:seed

puts "🌱 Starting database seeds..."
puts ""

# Load email campaign templates (default email automation)
if File.exist?(Rails.root.join('db/seeds/email_campaign_templates.rb'))
  puts "📧 Loading email campaign templates..."
  load Rails.root.join('db/seeds/email_campaign_templates.rb')
  puts "✅ Email templates loaded"
else
  puts "⚠️  Email template seeds file not found"
end

puts ""
puts "✅ Seeds complete!"
