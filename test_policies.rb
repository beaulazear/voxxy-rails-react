# Test policy acceptance functionality
user = User.first

if user
  puts "Testing policy acceptance for #{user.email}"

  # Check initial state
  puts "\nInitial Policy Status:"
  puts "Terms accepted: #{user.has_accepted_terms?}"
  puts "Privacy policy accepted: #{user.has_accepted_privacy_policy?}"
  puts "Community guidelines accepted: #{user.has_accepted_community_guidelines?}"
  puts "All policies accepted: #{user.has_accepted_all_policies?}"
  puts "Needs policy acceptance: #{user.needs_to_accept_updated_policies?}"

  # Accept all policies
  puts "\nAccepting all policies..."
  user.accept_all_policies!

  # Check after acceptance
  puts "\nAfter Acceptance:"
  puts "Terms accepted: #{user.has_accepted_terms?}"
  puts "Privacy policy accepted: #{user.has_accepted_privacy_policy?}"
  puts "Community guidelines accepted: #{user.has_accepted_community_guidelines?}"
  puts "All policies accepted: #{user.has_accepted_all_policies?}"
  puts "Needs policy acceptance: #{user.needs_to_accept_updated_policies?}"

  puts "\nDatabase values:"
  puts "Terms version: #{user.terms_version}"
  puts "Terms accepted at: #{user.terms_accepted_at}"
  puts "Privacy version: #{user.privacy_policy_version}"
  puts "Privacy accepted at: #{user.privacy_policy_accepted_at}"
  puts "Guidelines version: #{user.community_guidelines_version}"
  puts "Guidelines accepted at: #{user.community_guidelines_accepted_at}"
else
  puts "No users in database"
end
