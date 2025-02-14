#!/usr/bin/env bash
# exit on error
set -o errexit

# builds the front end code
rm -rf public
npm install --prefix client && npm run build --prefix client
cp -a client/build/. public/

# builds the back end code
bundle install

# 🚨 Delete all activities (but keep users)
echo "🚨 WARNING: Deleting all activities and related data..."
bundle exec rails runner "Activity.destroy_all"

echo "✅ All activities have been deleted!"
