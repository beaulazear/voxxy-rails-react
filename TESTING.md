# Testing Guide for Voxxy Rails

## Rails Backend Testing

We use RSpec for testing the Rails backend. The test suite includes model tests and API request tests.

### Running Tests

```bash
# Run all tests
rspec

# Run tests for a specific file
rspec spec/models/user_spec.rb

# Run tests for a specific directory
rspec spec/models/

# Run a specific test (by line number)
rspec spec/models/user_spec.rb:17

# Run tests with documentation format (more verbose)
rspec --format documentation
```

### Test Structure

```
spec/
├── factories/          # FactoryBot factories for creating test data
│   ├── activities.rb
│   ├── responses.rb
│   └── users.rb
├── models/            # Model tests
│   ├── activity_spec.rb
│   └── user_spec.rb
├── requests/          # API endpoint tests
│   └── authentication_spec.rb
├── support/           # Test helpers and configuration
│   └── auth_helper.rb
├── rails_helper.rb    # RSpec Rails configuration
└── spec_helper.rb     # RSpec general configuration
```

### Writing Tests

#### Model Tests
```ruby
# spec/models/user_spec.rb
require 'rails_helper'

RSpec.describe User, type: :model do
  describe 'validations' do
    it { should validate_presence_of(:name) }
    it { should validate_uniqueness_of(:email) }
  end
  
  describe 'associations' do
    it { should have_many(:activities) }
  end
end
```

#### Request Tests
```ruby
# spec/requests/authentication_spec.rb
require 'rails_helper'

RSpec.describe "Authentication", type: :request do
  describe "POST /users" do
    it "creates a new user" do
      expect {
        post "/users", params: { user: { name: "Test", email: "test@example.com", password: "password123" } }
      }.to change(User, :count).by(1)
    end
  end
end
```

### Using Factories

```ruby
# Create a user
user = create(:user)

# Build a user without saving
user = build(:user)

# Create with specific attributes
user = create(:user, email: "specific@example.com")

# Use traits
admin = create(:user, :admin)
unconfirmed_user = create(:user, :unconfirmed)
```

### Test Database

The test database is separate from your development database. To set it up:

```bash
# Create and migrate test database
RAILS_ENV=test rails db:create db:migrate

# If you need to reset the test database
RAILS_ENV=test rails db:drop db:create db:migrate
```

### Testing Best Practices

1. **Keep tests isolated**: Each test should be independent and not rely on other tests
2. **Use factories**: Don't create test data manually, use FactoryBot
3. **Test one thing**: Each test should verify one specific behavior
4. **Use descriptive names**: Test descriptions should clearly state what is being tested
5. **Clean database**: DatabaseCleaner ensures each test starts with a clean database

### Debugging Tests

```ruby
# Add debugging output in tests
it "does something" do
  user = create(:user)
  puts user.inspect  # Will show in test output
  binding.pry        # If you have pry installed
end
```

### Coverage

To add test coverage reporting, add SimpleCov to your Gemfile:

```ruby
group :test do
  gem 'simplecov', require: false
end
```

Then add to the top of `spec/spec_helper.rb`:

```ruby
require 'simplecov'
SimpleCov.start 'rails'
```

## React Frontend Testing

The React app is set up with Jest by default through Create React App.

### Running React Tests

```bash
cd client
npm test           # Run tests in watch mode
npm test -- --coverage  # Run with coverage report
npm test -- --watchAll=false  # Run once and exit
```

### Example React Test

```javascript
// src/components/Login.test.js
import { render, screen } from '@testing-library/react';
import Login from './Login';

test('renders login form', () => {
  render(<Login />);
  const emailInput = screen.getByLabelText(/email/i);
  expect(emailInput).toBeInTheDocument();
});
```

## Continuous Integration

Consider setting up GitHub Actions to run tests automatically:

```yaml
# .github/workflows/test.yml
name: Run Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    
    steps:
    - uses: actions/checkout@v3
    - uses: ruby/setup-ruby@v1
      with:
        bundler-cache: true
    
    - name: Setup test database
      env:
        RAILS_ENV: test
        DATABASE_URL: postgres://postgres:postgres@localhost:5432/voxxy_test
      run: |
        bundle exec rails db:create
        bundle exec rails db:migrate
    
    - name: Run tests
      env:
        RAILS_ENV: test
        DATABASE_URL: postgres://postgres:postgres@localhost:5432/voxxy_test
      run: bundle exec rspec
```