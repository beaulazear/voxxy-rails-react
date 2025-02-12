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

# Only delete data in development (not in production or Render)
if [ "$RAILS_ENV" = "development" ]; then
  echo "Are you sure you want to DELETE all data from the database? This cannot be undone! (yes/no)"
  read confirmation
  if [ "$confirmation" = "yes" ]; then
    echo "Deleting all data..."
    bundle exec rake db:truncate_all  # Replace with db:reset if needed
    echo "Database has been wiped clean!"
  else
    echo "Aborting data deletion."
  fi
fi