# db/seeds.rb

# Clear existing records
User.destroy_all

# Create seed users
User.create(name: "John Doe")
User.create(name: "Jane Smith")
User.create(name: "Beau Lazear")