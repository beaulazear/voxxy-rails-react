# app/models/bug_report.rb
class BugReport < ApplicationRecord
    validates :name, :email, :bug_description, presence: true
end
