# CSV Upload Feature - Implementation Guide

**Feature:** Bulk vendor contact import via CSV upload
**Estimated Time:** 14-17 hours (2-3 days)
**Difficulty:** Moderate (6/10)
**Created:** 2025-12-31

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Phase 1: Backend Implementation](#phase-1-backend-implementation)
4. [Phase 2: Frontend Implementation](#phase-2-frontend-implementation)
5. [Phase 3: Testing & Refinement](#phase-3-testing--refinement)
6. [Troubleshooting](#troubleshooting)
7. [Future Enhancements](#future-enhancements)

---

## Overview

### What We're Building

A CSV bulk import feature for vendor contacts that allows producers to upload 1000+ contacts at once instead of manual one-by-one entry.

### Current State

- ✅ VendorContact model with validations
- ✅ Single contact creation via modal form
- ✅ API endpoints for CRUD operations
- ❌ No bulk import capability

### Target State

- ✅ CSV file upload with drag-and-drop
- ✅ Client-side preview and validation
- ✅ Batch processing for 1000+ records
- ✅ Duplicate detection (email-based)
- ✅ Detailed error reporting
- ✅ Downloadable CSV template
- ✅ Progress indicators

### Key Decisions Made

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Duplicate Strategy** | Skip duplicates by email | Prevents accidental duplicates, user-friendly |
| **Batch Size** | 200 records per batch | Balances performance and memory |
| **Timeout** | 2 minutes | Prevents long-running requests |
| **Background Jobs** | Optional (for 5000+) | Start synchronous, add async if needed |
| **CSV Library** | Ruby stdlib CSV | No extra dependencies needed |

---

## Prerequisites

### Backend (Rails)

Already have:
- ✅ Ruby CSV library (stdlib)
- ✅ VendorContact model
- ✅ Existing validations

No new gems needed!

### Frontend (React)

Need to install:
```bash
cd /Users/beaulazear/Desktop/voxxy-presents-client
npm install papaparse @types/papaparse
```

**Why papaparse?**
- Industry standard CSV parser
- Header detection
- Error handling
- TypeScript support

---

## Phase 1: Backend Implementation

**Time Estimate:** 3-4 hours

### Step 1.1: Create Import Service (90 minutes)

**File:** `/Users/beaulazear/Desktop/voxxy-rails/app/services/vendor_contact_import_service.rb`

```ruby
# frozen_string_literal: true

require 'csv'

class VendorContactImportService
  attr_reader :organization, :csv_file, :options, :results

  def initialize(organization, csv_file, options = {})
    @organization = organization
    @csv_file = csv_file
    @options = {
      skip_duplicates: options.fetch(:skip_duplicates, true),
      update_existing: options.fetch(:update_existing, false),
      tags: options.fetch(:tags, [])
    }
    @results = {
      total_rows: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
      errors: []
    }
  end

  def process
    # Parse CSV with proper encoding
    csv_data = parse_csv

    @results[:total_rows] = csv_data.length

    # Process in batches of 200 to avoid memory issues
    csv_data.each_slice(200).with_index do |batch, batch_index|
      process_batch(batch, batch_index * 200)
    end

    @results
  rescue CSV::MalformedCSVError => e
    @results[:errors] << {
      row: 'N/A',
      field: 'file',
      message: "Invalid CSV format: #{e.message}"
    }
    @results
  rescue StandardError => e
    @results[:errors] << {
      row: 'N/A',
      field: 'file',
      message: "Import failed: #{e.message}"
    }
    @results
  end

  private

  def parse_csv
    # Read file with UTF-8 encoding, handle BOM
    content = @csv_file.read.force_encoding('UTF-8')
    content.gsub!("\xEF\xBB\xBF", '') # Remove BOM if present

    CSV.parse(content, headers: true, header_converters: :symbol)
  rescue ArgumentError => e
    # Try with ISO-8859-1 encoding if UTF-8 fails
    content = @csv_file.read.force_encoding('ISO-8859-1').encode('UTF-8')
    CSV.parse(content, headers: true, header_converters: :symbol)
  end

  def process_batch(batch, offset)
    batch.each_with_index do |row, index|
      line_number = offset + index + 2 # +2 for header row and 0-indexing
      process_row(row, line_number)
    end
  end

  def process_row(row, line_number)
    # Validate row
    validation_result = validate_row(row, line_number)

    unless validation_result[:valid]
      @results[:failed] += 1
      @results[:errors].concat(validation_result[:errors])
      return
    end

    # Build contact attributes
    contact_data = build_contact_data(row)

    # Check for duplicates by email
    existing_contact = find_existing_contact(contact_data[:email])

    if existing_contact
      handle_existing_contact(existing_contact, contact_data, line_number)
    else
      create_new_contact(contact_data, line_number)
    end
  rescue StandardError => e
    @results[:failed] += 1
    @results[:errors] << {
      row: line_number,
      field: 'general',
      message: "Unexpected error: #{e.message}"
    }
  end

  def validate_row(row, line_number)
    errors = []

    # Required: name
    if row[:name].blank?
      errors << {
        row: line_number,
        field: 'name',
        message: 'Name is required'
      }
    end

    # Email format (if provided)
    if row[:email].present? && !row[:email].match?(URI::MailTo::EMAIL_REGEXP)
      errors << {
        row: line_number,
        field: 'email',
        message: 'Invalid email format'
      }
    end

    # Phone format (if provided)
    if row[:phone].present? && !row[:phone].match?(/\A[0-9\-\(\)\s\+\.]*\z/)
      errors << {
        row: line_number,
        field: 'phone',
        message: 'Invalid phone format'
      }
    end

    # Contact type enum
    valid_types = %w[lead vendor partner client other]
    if row[:contact_type].present? && !valid_types.include?(row[:contact_type].downcase)
      errors << {
        row: line_number,
        field: 'contact_type',
        message: "Invalid contact_type (must be: #{valid_types.join(', ')})"
      }
    end

    # Status enum
    valid_statuses = %w[new contacted interested converted closed]
    if row[:status].present? && !valid_statuses.include?(row[:status].downcase)
      errors << {
        row: line_number,
        field: 'status',
        message: "Invalid status (must be: #{valid_statuses.join(', ')})"
      }
    end

    { valid: errors.empty?, errors: errors }
  end

  def build_contact_data(row)
    # Parse tags (comma-separated string to array)
    tags = if row[:tags].present?
             row[:tags].to_s.split(',').map(&:strip).reject(&:blank?)
           else
             []
           end

    # Merge with additional tags from options
    tags = (tags + @options[:tags]).uniq

    {
      name: row[:name]&.strip,
      email: row[:email]&.strip&.downcase,
      phone: row[:phone]&.strip,
      company_name: row[:business_name]&.strip || row[:company_name]&.strip,
      job_title: row[:job_title]&.strip,
      contact_type: row[:contact_type]&.strip&.downcase || 'vendor',
      status: row[:status]&.strip&.downcase || 'new',
      tags: tags,
      notes: row[:notes]&.strip,
      source: 'csv_import',
      imported_at: Time.current,
      organization_id: @organization.id
    }
  end

  def find_existing_contact(email)
    return nil if email.blank?
    @organization.vendor_contacts.find_by(email: email)
  end

  def handle_existing_contact(existing_contact, contact_data, line_number)
    if @options[:update_existing]
      if existing_contact.update(contact_data.except(:organization_id))
        @results[:updated] += 1
      else
        @results[:failed] += 1
        @results[:errors] << {
          row: line_number,
          field: 'general',
          message: "Update failed: #{existing_contact.errors.full_messages.join(', ')}"
        }
      end
    elsif @options[:skip_duplicates]
      @results[:skipped] += 1
      @results[:errors] << {
        row: line_number,
        field: 'email',
        message: "Email already exists: #{contact_data[:email]}"
      }
    else
      # Allow duplicates - create new contact
      create_new_contact(contact_data, line_number)
    end
  end

  def create_new_contact(contact_data, line_number)
    contact = @organization.vendor_contacts.build(contact_data)

    if contact.save
      @results[:created] += 1
    else
      @results[:failed] += 1
      @results[:errors] << {
        row: line_number,
        field: 'general',
        message: contact.errors.full_messages.join(', ')
      }
    end
  end
end
```

**Key Features:**
- ✅ UTF-8 encoding support with BOM handling
- ✅ Batch processing (200 records at a time)
- ✅ Row-level validation using model validations
- ✅ Duplicate detection by email
- ✅ Detailed error reporting with row numbers
- ✅ Support for update existing or skip duplicates
- ✅ Tag merging (CSV tags + bulk tags)

---

### Step 1.2: Add Controller Action (45 minutes)

**File:** `/Users/beaulazear/Desktop/voxxy-rails/app/controllers/api/v1/presents/vendor_contacts_controller.rb`

**Add this action to the existing controller:**

```ruby
# POST /api/v1/presents/vendor_contacts/bulk_import
def bulk_import
  # Ensure user owns an organization
  unless current_user.organizations.any?
    render json: { error: 'You must have an organization to import contacts' }, status: :forbidden
    return
  end

  # Get the organization (use first organization for now)
  organization = current_user.organizations.first

  # Validate file presence
  unless params[:file].present?
    render json: { error: 'No file provided' }, status: :unprocessable_entity
    return
  end

  # Validate file type
  file = params[:file]
  unless file.content_type == 'text/csv' || file.original_filename.end_with?('.csv')
    render json: { error: 'File must be a CSV' }, status: :unprocessable_entity
    return
  end

  # Parse options
  options = {
    skip_duplicates: ActiveModel::Type::Boolean.new.cast(params[:skip_duplicates] || true),
    update_existing: ActiveModel::Type::Boolean.new.cast(params[:update_existing] || false),
    tags: params[:tags].present? ? JSON.parse(params[:tags]) : []
  }

  # Process import
  import_service = VendorContactImportService.new(organization, file, options)

  # Set timeout to prevent long-running requests
  result = Timeout.timeout(120) do
    import_service.process
  end

  # Return results
  render json: {
    success: true,
    summary: {
      total_rows: result[:total_rows],
      created: result[:created],
      updated: result[:updated],
      skipped: result[:skipped],
      failed: result[:failed]
    },
    errors: result[:errors]
  }, status: :ok

rescue Timeout::Error
  render json: {
    error: 'Import timeout - file too large. Please split into smaller files.'
  }, status: :request_timeout

rescue StandardError => e
  render json: {
    error: "Import failed: #{e.message}"
  }, status: :internal_server_error
end
```

**Add timeout require at top of file:**

```ruby
require 'timeout'
```

---

### Step 1.3: Add Route (5 minutes)

**File:** `/Users/beaulazear/Desktop/voxxy-rails/config/routes.rb`

**Find the vendor_contacts resources block and add:**

```ruby
namespace :presents do
  resources :vendor_contacts do
    collection do
      post :bulk_import  # Add this line
    end

    member do
      post :record_interaction
      post :add_tag
      delete :remove_tag
    end
  end
end
```

---

### Step 1.4: Test Backend with curl (30 minutes)

**Create a test CSV file:**

```bash
cat > test_contacts.csv << 'EOF'
name,email,phone,business_name,job_title,contact_type,tags,notes
Sarah Mitchell,sarah@ceramics.com,555-1234,Sarah's Ceramics,Owner,vendor,"art,local",Met at Spring Market 2024
John Davidson,john@foodtruck.com,555-5678,John's Tacos,Manager,vendor,"food,catering",Interested in summer events
Maria Santos,maria@events.com,555-9012,Event Solutions,Event Coordinator,partner,"planning,logistics",Partnership opportunity
EOF
```

**Test the endpoint:**

```bash
# Get your auth token first
TOKEN="your_jwt_token_here"

# Upload CSV
curl -X POST http://localhost:3000/api/v1/presents/vendor_contacts/bulk_import \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test_contacts.csv" \
  -F "skip_duplicates=true"
```

**Expected response:**

```json
{
  "success": true,
  "summary": {
    "total_rows": 3,
    "created": 3,
    "updated": 0,
    "skipped": 0,
    "failed": 0
  },
  "errors": []
}
```

**Test duplicate detection:**

```bash
# Upload same file again
curl -X POST http://localhost:3000/api/v1/presents/vendor_contacts/bulk_import \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@test_contacts.csv" \
  -F "skip_duplicates=true"
```

**Expected response:**

```json
{
  "success": true,
  "summary": {
    "total_rows": 3,
    "created": 0,
    "updated": 0,
    "skipped": 3,
    "failed": 0
  },
  "errors": [
    {"row": 2, "field": "email", "message": "Email already exists: sarah@ceramics.com"},
    {"row": 3, "field": "email", "message": "Email already exists: john@foodtruck.com"},
    {"row": 4, "field": "email", "message": "Email already exists: maria@events.com"}
  ]
}
```

---

## Phase 2: Frontend Implementation

**Time Estimate:** 4-5 hours

### Step 2.1: Install Dependencies (5 minutes)

```bash
cd /Users/beaulazear/Desktop/voxxy-presents-client
npm install papaparse @types/papaparse
```

---

### Step 2.2: Create CSV Template Generator (30 minutes)

**File:** `/Users/beaulazear/Desktop/voxxy-presents-client/src/utils/csvTemplateGenerator.ts`

```typescript
export function generateCSVTemplate(): string {
  const headers = [
    'name',
    'email',
    'phone',
    'business_name',
    'job_title',
    'contact_type',
    'tags',
    'notes'
  ];

  const exampleRows = [
    {
      name: 'Sarah Mitchell',
      email: 'sarah@ceramics.com',
      phone: '555-1234',
      business_name: "Sarah's Ceramics",
      job_title: 'Owner',
      contact_type: 'vendor',
      tags: 'art,local',
      notes: 'Met at Spring Market 2024'
    },
    {
      name: 'John Davidson',
      email: 'john@foodtruck.com',
      phone: '555-5678',
      business_name: "John's Tacos",
      job_title: 'Manager',
      contact_type: 'vendor',
      tags: 'food,catering',
      notes: 'Interested in summer events'
    }
  ];

  // Build CSV content
  const csvContent = [
    headers.join(','),
    ...exampleRows.map(row =>
      headers.map(header => {
        const value = row[header as keyof typeof row] || '';
        // Escape values with commas or quotes
        if (value.includes(',') || value.includes('"')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',')
    )
  ].join('\n');

  return csvContent;
}

export function downloadCSVTemplate(): void {
  const csv = generateCSVTemplate();
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', 'vendor_contacts_template.csv');
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function downloadErrorReport(
  errors: Array<{ row: number; field: string; message: string }>,
  fileName: string = 'import_errors.csv'
): void {
  const headers = ['Row Number', 'Field', 'Error Message'];
  const csvContent = [
    headers.join(','),
    ...errors.map(err =>
      `${err.row},"${err.field}","${err.message.replace(/"/g, '""')}"`
    )
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
```

---

### Step 2.3: Add API Client Method (20 minutes)

**File:** `/Users/beaulazear/Desktop/voxxy-presents-client/src/services/api.ts`

**Add this interface near the VendorContact interface:**

```typescript
export interface BulkImportResult {
  success: boolean;
  summary: {
    total_rows: number;
    created: number;
    updated: number;
    skipped: number;
    failed: number;
  };
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
}

export interface BulkImportOptions {
  skipDuplicates?: boolean;
  updateExisting?: boolean;
  tags?: string[];
}
```

**Add this method to the vendorContactsApi object:**

```typescript
export const vendorContactsApi = {
  // ... existing methods ...

  async bulkImport(
    file: File,
    options: BulkImportOptions = {}
  ): Promise<BulkImportResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('skip_duplicates', String(options.skipDuplicates ?? true));
    formData.append('update_existing', String(options.updateExisting ?? false));

    if (options.tags && options.tags.length > 0) {
      formData.append('tags', JSON.stringify(options.tags));
    }

    const response = await fetch(
      `${API_BASE_URL}/v1/presents/vendor_contacts/bulk_import`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
          // Don't set Content-Type - browser will set it with boundary for multipart
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Import failed');
    }

    return response.json();
  },
};
```

---

### Step 2.4: Create CSV Upload Modal Component (2-3 hours)

**File:** `/Users/beaulazear/Desktop/voxxy-presents-client/src/components/producer/Network/CSVUploadModal.tsx`

```typescript
import React, { useState, useRef } from 'react';
import Papa from 'papaparse';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Upload,
  Download,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { vendorContactsApi, BulkImportResult } from '@/services/api';
import {
  downloadCSVTemplate,
  downloadErrorReport,
} from '@/utils/csvTemplateGenerator';

interface CSVUploadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

type UploadState = 'idle' | 'file_selected' | 'validating' | 'uploading' | 'success' | 'error';

interface CSVPreviewData {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
}

export function CSVUploadModal({ open, onClose, onSuccess }: CSVUploadModalProps) {
  const [state, setState] = useState<UploadState>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<CSVPreviewData | null>(null);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [bulkTags, setBulkTags] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const requiredHeaders = ['name', 'email'];
  const optionalHeaders = ['phone', 'business_name', 'job_title', 'contact_type', 'tags', 'notes'];
  const allExpectedHeaders = [...requiredHeaders, ...optionalHeaders];

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setErrorMessage('Please select a CSV file');
      setState('error');
      return;
    }

    setSelectedFile(file);
    setState('validating');
    setErrorMessage('');

    // Parse CSV for preview
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      preview: 10, // Only parse first 10 rows for preview
      complete: (results) => {
        const headers = results.meta.fields || [];

        // Check for required headers
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        if (missingHeaders.length > 0) {
          setErrorMessage(`Missing required columns: ${missingHeaders.join(', ')}`);
          setState('error');
          return;
        }

        // Count total rows (need to parse entire file)
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: (fullResults) => {
            setPreviewData({
              headers,
              rows: results.data as Record<string, string>[],
              totalRows: fullResults.data.length,
            });
            setState('file_selected');
          },
        });
      },
      error: (error) => {
        setErrorMessage(`Failed to parse CSV: ${error.message}`);
        setState('error');
      },
    });
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setState('uploading');
    setErrorMessage('');

    try {
      const tags = bulkTags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const result = await vendorContactsApi.bulkImport(selectedFile, {
        skipDuplicates,
        updateExisting,
        tags,
      });

      setImportResult(result);
      setState('success');

      // Refresh parent list after successful import
      onSuccess();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Upload failed');
      setState('error');
    }
  };

  const handleReset = () => {
    setState('idle');
    setSelectedFile(null);
    setPreviewData(null);
    setImportResult(null);
    setErrorMessage('');
    setBulkTags('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const renderIdleState = () => (
    <div className="space-y-4">
      {/* Template Download */}
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          First time importing?{' '}
          <button
            onClick={downloadCSVTemplate}
            className="font-medium text-primary hover:underline"
          >
            Download our CSV template
          </button>{' '}
          to get started.
        </AlertDescription>
      </Alert>

      {/* Drag and Drop Zone */}
      <div
        onDrop={handleFileDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-primary transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-600">
          Drag and drop your CSV file here, or click to browse
        </p>
        <p className="mt-1 text-xs text-gray-500">CSV files only</p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleFileInputChange}
        className="hidden"
      />
    </div>
  );

  const renderFileSelectedState = () => (
    <div className="space-y-4">
      {/* File Info */}
      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          <strong>{selectedFile?.name}</strong> ({previewData?.totalRows} contacts)
        </AlertDescription>
      </Alert>

      {/* Preview Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-2 border-b">
          <h4 className="text-sm font-medium">Preview (first 10 rows)</h4>
        </div>
        <div className="overflow-x-auto max-h-64">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 sticky top-0">
              <tr>
                {previewData?.headers.map((header) => (
                  <th
                    key={header}
                    className="px-4 py-2 text-left font-medium text-gray-700 border-b"
                  >
                    {header}
                    {requiredHeaders.includes(header) && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewData?.rows.map((row, idx) => (
                <tr key={idx} className="border-b hover:bg-gray-50">
                  {previewData.headers.map((header) => (
                    <td key={header} className="px-4 py-2 text-gray-600">
                      {row[header] || <span className="text-gray-400">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Import Options */}
      <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
        <h4 className="text-sm font-medium">Import Options</h4>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="skip-duplicates"
            checked={skipDuplicates}
            onCheckedChange={(checked) => setSkipDuplicates(checked as boolean)}
          />
          <Label htmlFor="skip-duplicates" className="text-sm cursor-pointer">
            Skip duplicates (based on email)
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="update-existing"
            checked={updateExisting}
            onCheckedChange={(checked) => setUpdateExisting(checked as boolean)}
          />
          <Label htmlFor="update-existing" className="text-sm cursor-pointer">
            Update existing contacts (if email matches)
          </Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="bulk-tags" className="text-sm">
            Add tags to all imported contacts (comma-separated)
          </Label>
          <Input
            id="bulk-tags"
            placeholder="e.g., imported, 2025, summer-vendors"
            value={bulkTags}
            onChange={(e) => setBulkTags(e.target.value)}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={handleReset}>
          Choose Different File
        </Button>
        <Button onClick={handleUpload}>
          Import {previewData?.totalRows} Contacts
        </Button>
      </div>
    </div>
  );

  const renderUploadingState = () => (
    <div className="space-y-4 py-8">
      <div className="flex flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium">Importing contacts...</p>
        <p className="text-sm text-gray-500 mt-2">
          This may take a few moments for large files
        </p>
      </div>
    </div>
  );

  const renderSuccessState = () => (
    <div className="space-y-4">
      {/* Success Header */}
      <div className="flex items-center justify-center py-4">
        <CheckCircle2 className="h-12 w-12 text-green-500" />
      </div>
      <h3 className="text-lg font-medium text-center">Import Complete!</h3>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="border rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-600">
            {importResult?.summary.created}
          </div>
          <div className="text-sm text-gray-600">Created</div>
        </div>

        {importResult && importResult.summary.updated > 0 && (
          <div className="border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">
              {importResult.summary.updated}
            </div>
            <div className="text-sm text-gray-600">Updated</div>
          </div>
        )}

        {importResult && importResult.summary.skipped > 0 && (
          <div className="border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {importResult.summary.skipped}
            </div>
            <div className="text-sm text-gray-600">Skipped</div>
          </div>
        )}

        {importResult && importResult.summary.failed > 0 && (
          <div className="border rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-600">
              {importResult.summary.failed}
            </div>
            <div className="text-sm text-gray-600">Failed</div>
          </div>
        )}
      </div>

      {/* Errors */}
      {importResult && importResult.errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-medium">
                {importResult.errors.length} row(s) had errors:
              </p>
              <div className="max-h-32 overflow-y-auto text-xs space-y-1">
                {importResult.errors.slice(0, 5).map((error, idx) => (
                  <div key={idx}>
                    Row {error.row}: {error.message}
                  </div>
                ))}
                {importResult.errors.length > 5 && (
                  <div className="text-gray-500">
                    ...and {importResult.errors.length - 5} more errors
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadErrorReport(importResult.errors)}
                className="mt-2"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Error Report
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={handleReset}>
          Import Another File
        </Button>
        <Button onClick={handleClose}>Done</Button>
      </div>
    </div>
  );

  const renderErrorState = () => (
    <div className="space-y-4">
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertDescription>{errorMessage}</AlertDescription>
      </Alert>
      <div className="flex justify-end">
        <Button onClick={handleReset}>Try Again</Button>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Contacts from CSV</DialogTitle>
          <DialogDescription>
            Upload a CSV file to bulk import vendor contacts
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {state === 'idle' && renderIdleState()}
          {state === 'validating' && (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {state === 'file_selected' && renderFileSelectedState()}
          {state === 'uploading' && renderUploadingState()}
          {state === 'success' && renderSuccessState()}
          {state === 'error' && renderErrorState()}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

### Step 2.5: Integrate into Network Page (30 minutes)

**File:** `/Users/beaulazear/Desktop/voxxy-presents-client/src/components/producer/Network/NetworkPage.tsx`

**Add import:**

```typescript
import { CSVUploadModal } from './CSVUploadModal';
```

**Add state:**

```typescript
const [csvUploadModalOpen, setCsvUploadModalOpen] = useState(false);
```

**Add button next to "Add Contact" button:**

```typescript
<div className="flex gap-2">
  <Button
    onClick={() => setAddContactModalOpen(true)}
    variant="default"
  >
    <Plus className="h-4 w-4 mr-2" />
    Add Contact
  </Button>

  <Button
    onClick={() => setCsvUploadModalOpen(true)}
    variant="outline"
  >
    <Upload className="h-4 w-4 mr-2" />
    Import CSV
  </Button>
</div>
```

**Add the modal component:**

```typescript
<CSVUploadModal
  open={csvUploadModalOpen}
  onClose={() => setCsvUploadModalOpen(false)}
  onSuccess={() => {
    // Refresh contacts list
    fetchContacts();
  }}
/>
```

---

## Phase 3: Testing & Refinement

**Time Estimate:** 2-3 hours

### Test Cases

#### Backend Tests

**File:** `/Users/beaulazear/Desktop/voxxy-rails/spec/services/vendor_contact_import_service_spec.rb`

```ruby
require 'rails_helper'

RSpec.describe VendorContactImportService do
  let(:organization) { create(:organization) }
  let(:csv_file) { fixture_file_upload('vendor_contacts.csv', 'text/csv') }

  describe '#process' do
    context 'with valid CSV' do
      it 'creates contacts successfully' do
        service = VendorContactImportService.new(organization, csv_file)
        result = service.process

        expect(result[:created]).to eq(3)
        expect(result[:failed]).to eq(0)
        expect(organization.vendor_contacts.count).to eq(3)
      end
    end

    context 'with duplicates' do
      before do
        create(:vendor_contact, organization: organization, email: 'sarah@ceramics.com')
      end

      it 'skips duplicates when skip_duplicates is true' do
        service = VendorContactImportService.new(organization, csv_file, skip_duplicates: true)
        result = service.process

        expect(result[:skipped]).to eq(1)
        expect(result[:created]).to eq(2)
      end
    end

    context 'with invalid data' do
      let(:invalid_csv) { fixture_file_upload('invalid_vendor_contacts.csv', 'text/csv') }

      it 'reports validation errors' do
        service = VendorContactImportService.new(organization, invalid_csv)
        result = service.process

        expect(result[:failed]).to be > 0
        expect(result[:errors]).not_to be_empty
      end
    end
  end
end
```

#### Manual Testing Checklist

- [ ] **Upload valid CSV with 10 contacts**
  - All contacts created successfully
  - Success summary shows correct counts

- [ ] **Upload CSV with duplicates**
  - Duplicates skipped when option enabled
  - Duplicates updated when update option enabled

- [ ] **Upload CSV with validation errors**
  - Missing required fields (name)
  - Invalid email format
  - Invalid contact_type enum
  - Error messages show row numbers

- [ ] **Upload large CSV (1000+ rows)**
  - Completes within 2 minutes
  - No timeout errors
  - Correct counts in summary

- [ ] **Upload CSV with special characters**
  - UTF-8 encoding handled
  - Commas in fields handled
  - Quotes in fields handled

- [ ] **Upload CSV with bulk tags**
  - Tags applied to all contacts
  - Tags merged with existing CSV tags

- [ ] **Download CSV template**
  - Template has correct headers
  - Example rows are valid

- [ ] **Download error report**
  - Contains all failed rows
  - Shows error messages
  - Can be fixed and re-uploaded

- [ ] **UI States**
  - Idle: Shows upload zone
  - Validating: Shows spinner
  - File selected: Shows preview and options
  - Uploading: Shows progress message
  - Success: Shows summary and stats
  - Error: Shows error message and retry

---

## Troubleshooting

### Common Issues

#### Backend

**Issue:** `CSV::MalformedCSVError`
- **Cause:** Invalid CSV format or encoding
- **Fix:** Add encoding detection in parse_csv method

**Issue:** Timeout on large imports
- **Cause:** Too many records processed at once
- **Fix:** Reduce batch size or use background job

**Issue:** Memory issues with large files
- **Cause:** Loading entire file into memory
- **Fix:** Stream CSV processing with `CSV.foreach`

#### Frontend

**Issue:** File upload fails with CORS error
- **Cause:** Missing CORS headers for multipart/form-data
- **Fix:** Check Rails CORS configuration allows file uploads

**Issue:** CSV preview shows wrong data
- **Cause:** Encoding issues or papaparse configuration
- **Fix:** Ensure UTF-8 encoding, check skipEmptyLines option

**Issue:** Modal doesn't close after success
- **Cause:** State not reset properly
- **Fix:** Call handleReset in onClose handler

---

## Future Enhancements

### Short Term (1-2 weeks)

- [ ] **Background Job Processing**
  - Use Sidekiq for imports > 5000 records
  - Email user when import completes
  - Show progress updates via WebSocket

- [ ] **Field Mapping UI**
  - Let user map CSV columns to VendorContact fields
  - Support non-standard header names
  - Save mapping templates for reuse

- [ ] **Dry Run Mode**
  - Preview what will be created/updated without saving
  - Show detailed validation results
  - Confirm before actual import

### Medium Term (1-2 months)

- [ ] **Import History**
  - Track all imports with timestamps
  - View previous import results
  - Rollback capability

- [ ] **Advanced Duplicate Detection**
  - Fuzzy matching on name
  - Phone number matching
  - Manual conflict resolution UI

- [ ] **Excel Support**
  - Parse .xlsx files
  - Handle multiple sheets
  - Better formatting support

### Long Term (3+ months)

- [ ] **Integration Imports**
  - Import from Google Contacts
  - Import from Mailchimp
  - Import from HubSpot

- [ ] **Smart Validation**
  - Email verification API
  - Phone number validation
  - Address geocoding

---

## Resources

### Documentation

- **Ruby CSV Library:** https://ruby-doc.org/stdlib-3.0.0/libdoc/csv/rdoc/CSV.html
- **PapaParse:** https://www.papaparse.com/docs
- **Rails File Uploads:** https://guides.rubyonrails.org/form_helpers.html#uploading-files

### Example CSVs for Testing

**Valid CSV (test_contacts.csv):**
```csv
name,email,phone,business_name,job_title,contact_type,tags,notes
Sarah Mitchell,sarah@ceramics.com,555-1234,Sarah's Ceramics,Owner,vendor,"art,local",Met at Spring Market 2024
John Davidson,john@foodtruck.com,555-5678,John's Tacos,Manager,vendor,"food,catering",Interested in summer events
Maria Santos,maria@events.com,555-9012,Event Solutions,Event Coordinator,partner,"planning,logistics",Partnership opportunity
```

**Invalid CSV (test_invalid.csv):**
```csv
name,email,phone,business_name,job_title,contact_type,tags,notes
,sarah@ceramics.com,555-1234,Sarah's Ceramics,Owner,vendor,"art,local",Missing name
John Davidson,invalid-email,555-5678,John's Tacos,Manager,vendor,"food,catering",Invalid email
Maria Santos,maria@events.com,555-9012,Event Solutions,Event Coordinator,wrong_type,"planning,logistics",Invalid contact_type
```

**Large CSV Generator Script:**
```ruby
# Generate 1000 test contacts
require 'csv'

CSV.open('large_test.csv', 'w') do |csv|
  csv << ['name', 'email', 'phone', 'business_name', 'job_title', 'contact_type', 'tags', 'notes']

  1000.times do |i|
    csv << [
      "Contact #{i}",
      "contact#{i}@example.com",
      "555-#{sprintf('%04d', i)}",
      "Business #{i}",
      "Title #{i}",
      'vendor',
      'test,bulk',
      "Test contact number #{i}"
    ]
  end
end
```

---

## Success Criteria

✅ **Feature is complete when:**

1. User can upload CSV file via drag-and-drop or file picker
2. CSV is validated client-side with preview
3. Server processes CSV and creates contacts in batches
4. Duplicate detection works (skip or update)
5. Bulk tags can be applied to all contacts
6. Import summary shows created/updated/skipped/failed counts
7. Errors are reported with row numbers
8. Error report can be downloaded as CSV
9. CSV template can be downloaded
10. 1000+ contacts can be imported within 2 minutes
11. Network page refreshes with new contacts after import
12. All edge cases handled (encoding, special characters, malformed CSV)

---

## Questions? Issues?

If you run into any problems during implementation:

1. Check the Troubleshooting section above
2. Review the error messages carefully (row numbers help!)
3. Test with small CSVs first (3-5 rows)
4. Use curl to test backend independently
5. Check browser console for frontend errors
6. Verify file encoding is UTF-8

**Happy coding! 🚀**
