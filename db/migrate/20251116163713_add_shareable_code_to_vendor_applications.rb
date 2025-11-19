class AddShareableCodeToVendorApplications < ActiveRecord::Migration[7.2]
  def up
    # Add column without null constraint first
    add_column :vendor_applications, :shareable_code, :string

    # Generate shareable codes for existing records
    VendorApplication.reset_column_information
    VendorApplication.find_each do |app|
      loop do
        date_part = Time.current.strftime('%Y%m')
        random_part = SecureRandom.alphanumeric(6).upcase
        code = "EVENT-#{date_part}-#{random_part}"

        unless VendorApplication.exists?(shareable_code: code)
          app.update_column(:shareable_code, code)
          break
        end
      end
    end

    # Now add null constraint and unique index
    change_column_null :vendor_applications, :shareable_code, false
    add_index :vendor_applications, :shareable_code, unique: true
  end

  def down
    remove_index :vendor_applications, :shareable_code
    remove_column :vendor_applications, :shareable_code
  end
end
