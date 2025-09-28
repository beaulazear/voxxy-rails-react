#!/usr/bin/env bash
# exit on error
set -o errexit

# builds the front end code
rm -rf public
npm install --prefix client && npm run build --prefix client
cp -a client/build/. public/

# builds the back end code
bundle install

# Precompile assets for production
# Skip loading the environment to avoid REDIS_URL dependency during build
bundle exec rails assets:precompile RAILS_ENV=production SECRET_KEY_BASE_DUMMY=1

bundle exec rails db:migrate