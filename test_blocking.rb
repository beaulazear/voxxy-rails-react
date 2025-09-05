# Test blocking functionality
user1 = User.first
user2 = User.second

if user1 && user2
  puts "Testing blocking functionality..."
  puts "User 1: #{user1.email}"
  puts "User 2: #{user2.email}"

  # Test blocking
  puts "\n1. Testing block method:"
  result = user1.block!(user2)
  puts "Block result: #{result}"
  puts "User1 blocking User2? #{user1.blocking?(user2)}"
  puts "User2 blocked by User1? #{user2.blocked_by?(user1)}"

  # Test duplicate block
  puts "\n2. Testing duplicate block:"
  result = user1.block!(user2)
  puts "Duplicate block result: #{result}"

  # Test unblock
  puts "\n3. Testing unblock:"
  user1.unblock!(user2)
  puts "User1 still blocking User2? #{user1.blocking?(user2)}"

  puts "\nBlocking functionality test completed!"
else
  puts "Need at least 2 users in database to test blocking"
end
