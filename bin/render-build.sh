#!/usr/bin/env bash
# exit on error
set -o errexit

# builds the front end code
rm -rf public
npm install --prefix client && npm run build --prefix client
cp -a client/build/. public/

# builds the back end code
bundle install

# Runs database migrations
bundle exec rake db:migrate

# If in production, create a default user
if [ "$RAILS_ENV" = "production" ]; then
  echo "Creating default user..."
  bundle exec rails runner "User.create!(
    name: 'Testing',
    username: 'testinguser',
    email: 'testing@gmail.com',
    password: 'testingpass',
    password_confirmation: 'testingpass',
    confirmed_at: Time.current
  ) unless User.exists?(email: 'testing@gmail.com')"
  echo "Default user created!"
fi