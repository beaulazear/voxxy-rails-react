require 'sendgrid-ruby'
include SendGrid

# Temporarily disable SSL verification
OpenSSL::SSL.const_set(:VERIFY_PEER, OpenSSL::SSL::VERIFY_NONE)

from = Email.new(email: 'team@voxxyai.com')
to = Email.new(email: 'beaulazear@gmail.com') # Replace with a valid email
subject = 'Test Email from Voxxy'
content = Content.new(type: 'text/plain', value: 'This is a test email sent via SendGrid.')
mail = Mail.new(from, subject, to, content)

sg = SendGrid::API.new(api_key: ENV['VoxxyKeyAPI'])
response = sg.client.mail._('send').post(request_body: mail.to_json)

puts "Using API Key: #{ENV['VoxxyKeyAPI']}"
puts "Status Code: #{response.status_code}"
puts "Response Body: #{response.body}"
puts "Response Headers: #{response.headers}"