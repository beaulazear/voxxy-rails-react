module Api
  module V1
    module Presents
      class BaseController < ApplicationController
        before_action :authorized
        before_action :check_presents_access

        private

        def check_presents_access
          unless @current_user.uses_presents? || @current_user.admin?
            render json: { error: "Access denied. Presents product access required." },
                   status: :forbidden
          end
        end

        def require_venue_owner
          unless @current_user.venue_owner? || @current_user.admin?
            render json: { error: "Venue owner access required" }, status: :forbidden
          end
        end

        def require_vendor
          unless @current_user.vendor? || @current_user.admin?
            render json: { error: "Vendor access required" }, status: :forbidden
          end
        end
      end
    end
  end
end
