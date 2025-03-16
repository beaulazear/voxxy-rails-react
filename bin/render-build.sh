#!/usr/bin/env bash
# Exit on error
set -o errexit

# Rollback last two migrations before deploying
bundle exec rails db:rollback STEP=2 || echo "Rollback skipped (possible fresh setup)"

# Builds the front end code
rm -rf public
npm install --prefix client && npm run build --prefix client
cp -a client/build/. public/

# Builds the back end code
bundle install

# Run database migrations
bundle exec rails db:migrate