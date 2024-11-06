# db/seeds.rb

# Clear existing records
User.destroy_all

# Create seed users
User.create(name: "Courtney Greer")
User.create(name: "Beau Lazear")