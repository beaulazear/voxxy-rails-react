#!/usr/bin/env bash
# exit on error
set -o errexit

# builds the front end code
rm -rf public
npm install --prefix client && npm run build --prefix client
cp -a client/build/. public/

# builds the back end code
bundle install

#remove below code immediatly after next push
echo "Destroying all users..."
bundle exec rails runner "User.destroy_all"

bundle exec rake db:migrate