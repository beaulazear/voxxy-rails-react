#!/usr/bin/env bash
# exit on error
set -o errexit

# builds the front end code
rm -rf public
npm install --prefix client && npm run build --prefix client
cp -a client/build/. public/

# builds the back end code
bundle install

# Clears the production database and recreates it
echo "🚨 Dropping and recreating production database..."
bundle exec rake db:drop db:create db:migrate

echo "✅ Database reset complete!"
