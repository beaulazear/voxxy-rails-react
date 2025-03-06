class Comment < ApplicationRecord
  belongs_to :user
  belongs_to :pinned_activity
end
