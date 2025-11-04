# Vendor Contact Import Feature - Implementation Guide

## Overview
Allow organizations to upload CSV files containing vendor contact information to build their personal email/contact lists.

**Difficulty:** 4/10 (Easy-Medium)
**Time Estimate:** 1-2 days
**Dependencies:** Rails CSV library (built-in), Active Storage (already configured), Sidekiq (already configured)

---

## Database Schema

### Migration

```ruby
# db/migrate/YYYYMMDDHHMMSS_create_vendor_contacts.rb
class CreateVendorContacts < ActiveRecord::Migration[7.2]
  def change
    create_table :vendor_contacts do |t|
      t.references :organization, null: false, foreign_key: true
      t.string :name
      t.string :email, null: false
      t.string :company
      t.string :phone
      t.string :vendor_type # 'catering', 'entertainment', 'venue', 'market_vendor', 'other'
      t.text :notes
      t.string :status, default: 'active' # 'active', 'unsubscribed', 'bounced'
      t.json :custom_fields # Flexible storage for additional CSV columns

      t.timestamps
    end

    add_index :vendor_contacts, [:organization_id, :email], unique: true
    add_index :vendor_contacts, :organization_id
    add_index :vendor_contacts, :email
    add_index :vendor_contacts, :status
    add_index :vendor_contacts, :vendor_type
  end
end

# db/migrate/YYYYMMDDHHMMSS_create_vendor_contact_imports.rb
class CreateVendorContactImports < ActiveRecord::Migration[7.2]
  def change
    create_table :vendor_contact_imports do |t|
      t.references :organization, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :filename
      t.string :status, default: 'processing' # 'processing', 'completed', 'failed'
      t.integer :total_rows, default: 0
      t.integer :imported_count, default: 0
      t.integer :updated_count, default: 0
      t.integer :failed_count, default: 0
      t.json :errors # Array of error messages
      t.datetime :completed_at

      t.timestamps
    end

    add_index :vendor_contact_imports, :organization_id
    add_index :vendor_contact_imports, :status
  end
end
```

---

## Models

### VendorContact Model

```ruby
# app/models/vendor_contact.rb
class VendorContact < ApplicationRecord
  belongs_to :organization

  VENDOR_TYPES = %w[catering entertainment venue market_vendor other].freeze
  STATUSES = %w[active unsubscribed bounced].freeze

  validates :email, presence: true, format: { with: URI::MailTo::EMAIL_REGEXP }
  validates :email, uniqueness: { scope: :organization_id, message: 'already exists in your contact list' }
  validates :vendor_type, inclusion: { in: VENDOR_TYPES }, allow_blank: true
  validates :status, inclusion: { in: STATUSES }

  before_validation :normalize_email

  scope :active, -> { where(status: 'active') }
  scope :by_type, ->(type) { where(vendor_type: type) }
  scope :subscribed, -> { where(status: 'active').where.not(status: 'unsubscribed') }

  def unsubscribe!
    update(status: 'unsubscribed')
  end

  def mark_bounced!
    update(status: 'bounced')
  end

  private

  def normalize_email
    self.email = email.strip.downcase if email.present?
  end
end
```

### VendorContactImport Model

```ruby
# app/models/vendor_contact_import.rb
class VendorContactImport < ApplicationRecord
  belongs_to :organization
  belongs_to :user

  validates :status, inclusion: { in: %w[processing completed failed] }

  def mark_completed!(results)
    update!(
      status: 'completed',
      total_rows: results[:total],
      imported_count: results[:imported],
      updated_count: results[:updated],
      failed_count: results[:failed],
      errors: results[:errors],
      completed_at: Time.current
    )
  end

  def mark_failed!(error_message)
    update!(
      status: 'failed',
      errors: [error_message],
      completed_at: Time.current
    )
  end

  def success_rate
    return 0 if total_rows.zero?
    ((imported_count + updated_count).to_f / total_rows * 100).round(2)
  end
end
```

---

## Controller

```ruby
# app/controllers/api/v1/presents/vendor_contacts_controller.rb
module Api
  module V1
    module Presents
      class VendorContactsController < BaseController
        before_action :set_organization
        before_action :check_organization_ownership
        before_action :set_vendor_contact, only: [:show, :update, :destroy]

        # GET /api/v1/presents/organizations/:org_slug/vendor_contacts
        def index
          contacts = @organization.vendor_contacts.includes(:organization)

          # Filtering
          contacts = contacts.by_type(params[:vendor_type]) if params[:vendor_type].present?
          contacts = contacts.active if params[:status] == 'active'

          # Search
          if params[:query].present?
            query = "%#{params[:query]}%"
            contacts = contacts.where(
              "name ILIKE ? OR email ILIKE ? OR company ILIKE ?",
              query, query, query
            )
          end

          # Pagination
          page = params[:page] || 1
          per_page = params[:per_page] || 50
          contacts = contacts.page(page).per(per_page)

          render json: {
            vendor_contacts: contacts.map { |c| VendorContactSerializer.new(c).basic },
            meta: {
              total: contacts.total_count,
              page: page.to_i,
              per_page: per_page.to_i
            }
          }
        end

        # GET /api/v1/presents/organizations/:org_slug/vendor_contacts/:id
        def show
          render json: VendorContactSerializer.new(@vendor_contact).full
        end

        # POST /api/v1/presents/organizations/:org_slug/vendor_contacts
        def create
          contact = @organization.vendor_contacts.build(vendor_contact_params)

          if contact.save
            render json: VendorContactSerializer.new(contact).full, status: :created
          else
            render json: { errors: contact.errors.full_messages }, status: :unprocessable_entity
          end
        end

        # PATCH /api/v1/presents/organizations/:org_slug/vendor_contacts/:id
        def update
          if @vendor_contact.update(vendor_contact_params)
            render json: VendorContactSerializer.new(@vendor_contact).full
          else
            render json: { errors: @vendor_contact.errors.full_messages }, status: :unprocessable_entity
          end
        end

        # DELETE /api/v1/presents/organizations/:org_slug/vendor_contacts/:id
        def destroy
          @vendor_contact.destroy
          head :no_content
        end

        # POST /api/v1/presents/organizations/:org_slug/vendor_contacts/import
        def import
          csv_file = params[:file]

          unless csv_file.present?
            return render json: { error: 'No file provided' }, status: :bad_request
          end

          # Check file type
          unless csv_file.content_type.in?(['text/csv', 'application/vnd.ms-excel', 'text/plain'])
            return render json: { error: 'Invalid file type. Please upload a CSV file.' }, status: :bad_request
          end

          # Create import record
          import = @organization.vendor_contact_imports.create!(
            user: @current_user,
            filename: csv_file.original_filename,
            status: 'processing'
          )

          # Process in background
          VendorContactImportJob.perform_later(
            import.id,
            csv_file.read,
            @current_user.id
          )

          render json: {
            message: 'Import started. You will be notified when it completes.',
            import: {
              id: import.id,
              status: import.status,
              filename: import.filename
            }
          }, status: :accepted
        end

        # GET /api/v1/presents/organizations/:org_slug/vendor_contacts/import_status/:import_id
        def import_status
          import = @organization.vendor_contact_imports.find(params[:import_id])

          render json: {
            id: import.id,
            status: import.status,
            filename: import.filename,
            total_rows: import.total_rows,
            imported_count: import.imported_count,
            updated_count: import.updated_count,
            failed_count: import.failed_count,
            success_rate: import.success_rate,
            errors: import.errors,
            completed_at: import.completed_at,
            created_at: import.created_at
          }
        end

        # GET /api/v1/presents/organizations/:org_slug/vendor_contacts/import_history
        def import_history
          imports = @organization.vendor_contact_imports
            .order(created_at: :desc)
            .limit(20)

          render json: imports.map { |i|
            {
              id: i.id,
              filename: i.filename,
              status: i.status,
              total_rows: i.total_rows,
              imported_count: i.imported_count,
              updated_count: i.updated_count,
              failed_count: i.failed_count,
              success_rate: i.success_rate,
              completed_at: i.completed_at,
              created_at: i.created_at
            }
          }
        end

        # GET /api/v1/presents/organizations/:org_slug/vendor_contacts/download_template
        def download_template
          csv_string = CSV.generate do |csv|
            csv << ['name', 'email', 'company', 'phone', 'vendor_type', 'notes']
            csv << ['John Smith', 'john@example.com', 'Elite Catering', '555-1234', 'catering', 'Preferred vendor']
            csv << ['Jane Doe', 'jane@example.com', 'DJ Services', '555-5678', 'entertainment', '']
            csv << ['Mike Brown', 'mike@example.com', 'The Grand Hall', '555-9012', 'venue', 'Large capacity']
          end

          send_data csv_string,
            filename: "vendor_contacts_template_#{Date.today}.csv",
            type: 'text/csv',
            disposition: 'attachment'
        end

        # POST /api/v1/presents/organizations/:org_slug/vendor_contacts/export
        def export
          contacts = @organization.vendor_contacts.active.order(:name)

          csv_string = CSV.generate do |csv|
            csv << ['Name', 'Email', 'Company', 'Phone', 'Vendor Type', 'Notes', 'Added Date']

            contacts.each do |contact|
              csv << [
                contact.name,
                contact.email,
                contact.company,
                contact.phone,
                contact.vendor_type,
                contact.notes,
                contact.created_at.strftime('%Y-%m-%d')
              ]
            end
          end

          send_data csv_string,
            filename: "#{@organization.slug}_vendor_contacts_#{Date.today}.csv",
            type: 'text/csv',
            disposition: 'attachment'
        end

        private

        def set_organization
          @organization = Organization.find_by!(slug: params[:organization_id])
        end

        def check_organization_ownership
          unless @organization.user_id == @current_user.id || @current_user.admin?
            render json: { error: 'Not authorized' }, status: :forbidden
          end
        end

        def set_vendor_contact
          @vendor_contact = @organization.vendor_contacts.find(params[:id])
        end

        def vendor_contact_params
          params.require(:vendor_contact).permit(
            :name, :email, :company, :phone, :vendor_type, :notes, :status
          )
        end
      end
    end
  end
end
```

---

## Background Job

```ruby
# app/jobs/vendor_contact_import_job.rb
class VendorContactImportJob < ApplicationJob
  queue_as :default

  def perform(import_id, csv_content, user_id)
    import = VendorContactImport.find(import_id)
    organization = import.organization

    results = {
      total: 0,
      imported: 0,
      updated: 0,
      failed: 0,
      errors: []
    }

    begin
      CSV.parse(csv_content, headers: true, header_converters: :symbol) do |row|
        results[:total] += 1

        # Validate required fields
        unless row[:email].present?
          results[:failed] += 1
          results[:errors] << "Row #{results[:total]}: Email is required"
          next
        end

        begin
          # Find or create contact
          contact = organization.vendor_contacts.find_or_initialize_by(
            email: row[:email].strip.downcase
          )

          is_new = contact.new_record?

          # Assign attributes
          contact.assign_attributes(
            name: row[:name]&.strip,
            company: row[:company]&.strip,
            phone: row[:phone]&.strip,
            vendor_type: row[:vendor_type]&.strip&.downcase,
            notes: row[:notes]&.strip
          )

          # Store any extra columns in custom_fields
          custom_data = row.to_h.except(:name, :email, :company, :phone, :vendor_type, :notes)
          contact.custom_fields = custom_data if custom_data.any?

          if contact.save
            is_new ? results[:imported] += 1 : results[:updated] += 1
          else
            results[:failed] += 1
            results[:errors] << "Row #{results[:total]} (#{row[:email]}): #{contact.errors.full_messages.join(', ')}"
          end

        rescue => e
          results[:failed] += 1
          results[:errors] << "Row #{results[:total]} (#{row[:email]}): #{e.message}"
        end
      end

      # Mark import as completed
      import.mark_completed!(results)

      # Send notification to user
      VendorContactImportNotificationService.send_completion_notification(
        user_id,
        import,
        results
      )

    rescue CSV::MalformedCSVError => e
      import.mark_failed!("Invalid CSV format: #{e.message}")
      VendorContactImportNotificationService.send_failure_notification(user_id, import)
    rescue => e
      import.mark_failed!("Import failed: #{e.message}")
      VendorContactImportNotificationService.send_failure_notification(user_id, import)
      raise # Re-raise for Sidekiq retry
    end
  end
end
```

---

## Serializer

```ruby
# app/serializers/vendor_contact_serializer.rb
class VendorContactSerializer < BaseSerializer
  def basic
    {
      id: object.id,
      name: object.name,
      email: object.email,
      company: object.company,
      vendor_type: object.vendor_type,
      status: object.status,
      created_at: object.created_at
    }
  end

  def full
    basic.merge(
      phone: object.phone,
      notes: object.notes,
      custom_fields: object.custom_fields,
      organization: OrganizationSerializer.new(object.organization).basic,
      updated_at: object.updated_at
    )
  end
end
```

---

## Service

```ruby
# app/services/vendor_contact_import_notification_service.rb
class VendorContactImportNotificationService
  def self.send_completion_notification(user_id, import, results)
    user = User.find(user_id)

    # Create in-app notification
    Notification.create!(
      user: user,
      title: 'Vendor Contact Import Complete',
      body: "Imported #{results[:imported]} new contacts, updated #{results[:updated]}. #{results[:failed]} failed.",
      notification_type: 'import_complete',
      data: {
        import_id: import.id,
        results: results
      }
    )

    # Send push notification
    if user.push_notifications && user.push_token.present?
      PushNotificationService.send_notification(
        user.push_token,
        user.platform,
        'Import Complete',
        "Successfully imported #{results[:imported] + results[:updated]} vendor contacts"
      )
    end

    # Send email summary
    VendorContactImportMailer.import_complete(user, import, results).deliver_later
  end

  def self.send_failure_notification(user_id, import)
    user = User.find(user_id)

    Notification.create!(
      user: user,
      title: 'Vendor Contact Import Failed',
      body: "Import failed. Please check your CSV file and try again.",
      notification_type: 'import_failed',
      data: {
        import_id: import.id
      }
    )
  end
end
```

---

## Routes

```ruby
# config/routes.rb
namespace :api do
  namespace :v1 do
    namespace :presents do
      resources :organizations do
        resources :vendor_contacts do
          collection do
            post :import
            get 'import_status/:import_id', action: :import_status
            get :import_history
            get :download_template
            post :export
          end
        end
      end
    end
  end
end
```

---

## CSV Template Format

### Required Columns:
- `email` (required)

### Optional Columns:
- `name`
- `company`
- `phone`
- `vendor_type` (catering, entertainment, venue, market_vendor, other)
- `notes`

### Example CSV:

```csv
name,email,company,phone,vendor_type,notes
John Smith,john@catering.com,Elite Catering,555-1234,catering,Preferred vendor for corporate events
Jane Doe,jane@dj.com,DJ Services,555-5678,entertainment,Available weekends
Mike Brown,mike@venue.com,The Grand Hall,555-9012,venue,Large capacity - 500+ guests
Sarah Wilson,sarah@flowers.com,Bloom & Co,555-3456,other,Floral arrangements and decorations
Tom Davis,tom@photo.com,Davis Photography,555-7890,entertainment,Specializes in event photography
```

---

## Testing

### Model Tests

```ruby
# spec/models/vendor_contact_spec.rb
require 'rails_helper'

RSpec.describe VendorContact, type: :model do
  it { should belong_to(:organization) }
  it { should validate_presence_of(:email) }

  describe 'email validation' do
    it 'validates email format' do
      contact = build(:vendor_contact, email: 'invalid-email')
      expect(contact).not_to be_valid
    end

    it 'normalizes email to lowercase' do
      contact = create(:vendor_contact, email: 'TEST@EXAMPLE.COM')
      expect(contact.email).to eq('test@example.com')
    end
  end

  describe 'uniqueness' do
    let(:organization) { create(:organization) }

    it 'prevents duplicate emails within same organization' do
      create(:vendor_contact, organization: organization, email: 'test@example.com')
      duplicate = build(:vendor_contact, organization: organization, email: 'test@example.com')

      expect(duplicate).not_to be_valid
    end

    it 'allows same email across different organizations' do
      org1 = create(:organization)
      org2 = create(:organization)

      create(:vendor_contact, organization: org1, email: 'test@example.com')
      duplicate = build(:vendor_contact, organization: org2, email: 'test@example.com')

      expect(duplicate).to be_valid
    end
  end
end
```

### Job Tests

```ruby
# spec/jobs/vendor_contact_import_job_spec.rb
require 'rails_helper'

RSpec.describe VendorContactImportJob, type: :job do
  let(:organization) { create(:organization) }
  let(:user) { organization.user }
  let(:import) { create(:vendor_contact_import, organization: organization, user: user) }

  describe '#perform' do
    it 'imports valid CSV data' do
      csv_content = <<~CSV
        name,email,company,vendor_type
        John Doe,john@example.com,Acme Corp,catering
        Jane Smith,jane@example.com,XYZ Inc,entertainment
      CSV

      expect {
        VendorContactImportJob.perform_now(import.id, csv_content, user.id)
      }.to change(VendorContact, :count).by(2)

      import.reload
      expect(import.status).to eq('completed')
      expect(import.imported_count).to eq(2)
      expect(import.failed_count).to eq(0)
    end

    it 'handles duplicate emails' do
      existing = create(:vendor_contact, organization: organization, email: 'john@example.com')

      csv_content = <<~CSV
        name,email,company
        John Doe Updated,john@example.com,New Company
      CSV

      VendorContactImportJob.perform_now(import.id, csv_content, user.id)

      import.reload
      expect(import.imported_count).to eq(0)
      expect(import.updated_count).to eq(1)

      existing.reload
      expect(existing.company).to eq('New Company')
    end

    it 'handles invalid emails' do
      csv_content = <<~CSV
        name,email,company
        John Doe,invalid-email,Acme Corp
      CSV

      VendorContactImportJob.perform_now(import.id, csv_content, user.id)

      import.reload
      expect(import.status).to eq('completed')
      expect(import.failed_count).to eq(1)
      expect(import.errors).not_to be_empty
    end
  end
end
```

### Controller Tests

```ruby
# spec/requests/api/v1/presents/vendor_contacts_spec.rb
require 'rails_helper'

RSpec.describe 'Api::V1::Presents::VendorContacts', type: :request do
  let(:venue_owner) { create(:user, role: 'venue_owner') }
  let(:organization) { create(:organization, user: venue_owner) }
  let(:auth_headers) { { 'Authorization' => "Bearer #{JsonWebToken.encode(user_id: venue_owner.id)}" } }

  describe 'POST /api/v1/presents/organizations/:org_slug/vendor_contacts/import' do
    it 'accepts CSV file and starts import' do
      csv_file = fixture_file_upload('vendor_contacts.csv', 'text/csv')

      expect {
        post "/api/v1/presents/organizations/#{organization.slug}/vendor_contacts/import",
          params: { file: csv_file },
          headers: auth_headers
      }.to change(VendorContactImport, :count).by(1)

      expect(response).to have_http_status(:accepted)
      expect(JSON.parse(response.body)['message']).to include('Import started')
    end

    it 'rejects non-CSV files' do
      image_file = fixture_file_upload('test_image.jpg', 'image/jpeg')

      post "/api/v1/presents/organizations/#{organization.slug}/vendor_contacts/import",
        params: { file: image_file },
        headers: auth_headers

      expect(response).to have_http_status(:bad_request)
      expect(JSON.parse(response.body)['error']).to include('Invalid file type')
    end
  end

  describe 'GET /api/v1/presents/organizations/:org_slug/vendor_contacts/download_template' do
    it 'downloads CSV template' do
      get "/api/v1/presents/organizations/#{organization.slug}/vendor_contacts/download_template",
        headers: auth_headers

      expect(response).to have_http_status(:success)
      expect(response.headers['Content-Type']).to eq('text/csv')
      expect(response.body).to include('name,email,company')
    end
  end
end
```

---

## Usage Example

### Frontend Implementation (React/React Native)

```javascript
// Upload CSV file
const uploadVendorContacts = async (organizationSlug, file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(
    `/api/v1/presents/organizations/${organizationSlug}/vendor_contacts/import`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData
    }
  );

  const data = await response.json();
  return data;
};

// Check import status
const checkImportStatus = async (organizationSlug, importId) => {
  const response = await fetch(
    `/api/v1/presents/organizations/${organizationSlug}/vendor_contacts/import_status/${importId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    }
  );

  return await response.json();
};

// Poll for completion
const pollImportStatus = (organizationSlug, importId, callback) => {
  const interval = setInterval(async () => {
    const status = await checkImportStatus(organizationSlug, importId);

    if (status.status === 'completed' || status.status === 'failed') {
      clearInterval(interval);
      callback(status);
    }
  }, 2000); // Check every 2 seconds
};
```

---

## Summary

### What You Get:
✅ CSV upload with validation
✅ Background processing (no timeout on large files)
✅ Duplicate detection (email uniqueness per org)
✅ Error handling with detailed feedback
✅ Import history tracking
✅ Template download
✅ Export functionality
✅ Notification on completion

### Time Breakdown:
- Database migration: 30 min
- Models: 1 hour
- Controller & routes: 2 hours
- Background job: 2 hours
- Serializer: 30 min
- Service: 1 hour
- Testing: 2 hours
- **Total: ~9-10 hours (1-2 days)**

### Complexity: 4/10
This is a well-trodden path in Rails with excellent documentation and library support. The main challenges are validation and error handling, but Rails makes CSV parsing straightforward.
