# db/seeds.rb

puts "🌱 Seeding admin user..."

# Create or update admin user (idempotent)
user = User.find_or_initialize_by(email: "beaulazear@gmail.com")

user.assign_attributes(
  name: "Beau Lazear",
  email: "beaulazear@gmail.com",
  password: "FUCKyou55!",
  password_confirmation: "FUCKyou55!",
  role: "admin",
  admin: true,
  confirmed_at: Time.current,
  confirmation_code: nil,
  confirmation_sent_at: nil
)

if user.save
  puts "✅ Admin user created/updated successfully: #{user.email} (ID: #{user.id})"
  puts "   Role: #{user.role}"
  puts "   Admin: #{user.admin?}"
  puts "   Verified: #{user.confirmed_at.present?}"
else
  puts "❌ Failed to create admin user: #{user.errors.full_messages.join(', ')}"
end
