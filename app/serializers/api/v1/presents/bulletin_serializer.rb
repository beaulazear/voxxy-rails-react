module Api
  module V1
    module Presents
      class BulletinSerializer
        def initialize(bulletin, options = {})
          @bulletin = bulletin
          @current_user_email = options[:current_user_email]
        end

        def as_json
          {
            id: @bulletin.id,
            event_id: @bulletin.event_id,
            subject: @bulletin.subject,
            body: @bulletin.body,
            bulletin_type: @bulletin.bulletin_type,
            pinned: @bulletin.pinned,
            view_count: @bulletin.view_count,
            read_count: @bulletin.read_count,
            read_by_current_user: read_by_current_user?,
            author: author_json,
            created_at: @bulletin.created_at,
            updated_at: @bulletin.updated_at
          }
        end

        private

        def author_json
          {
            id: @bulletin.author.id,
            name: @bulletin.author.name,
            email: @bulletin.author.email,
            role: @bulletin.author.role
          }
        end

        def read_by_current_user?
          return false unless @current_user_email
          @bulletin.read_by?(@current_user_email)
        end
      end
    end
  end
end
