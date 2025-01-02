# db/seeds.rb

puts "Seeding user"

user = User.create(
  name: "Testing",
  username: "testinguser",
  email: "testing@gmail.com",
  password: "testingpass",
  password_confirmation: "testingpass",
  confirmed_at: Time.current # Mark the user as confirmed
)

if user.persisted?
  puts "User created successfully: #{user.inspect}"
else
  puts "Failed to create user: #{user.errors.full_messages.join(', ')}"
end
