# db/seeds.rb

puts "Seeding user"

user = User.create(
  name: "Testing",
  username: "testinguser",
  email: "testing@gmail.com",
  password: "testingpass", # Rails will automatically hash this due to has_secure_password
  confirmed_at: Time.current # Mark the user as confirmed
)

if user.persisted?
  puts "User created successfully: #{user.inspect}"
else
  puts "Failed to create user: #{user.errors.full_messages.join(', ')}"
end
