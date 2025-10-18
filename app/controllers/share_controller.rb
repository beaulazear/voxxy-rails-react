# app/controllers/share_controller.rb
class ShareController < ActionController::Base
  include ApplicationHelper

  protect_from_forgery with: :exception, only: [ :favorite ]
  protect_from_forgery with: :null_session, if: -> { request.format.json? }

  def favorite
    @favorite_id = params[:id]
    @name = params[:name]
    @address = params[:address]
    @latitude = params[:lat]
    @longitude = params[:lng]

    # Optional: Fetch full details from database if favorite exists
    @favorite = UserActivity.find_by(id: @favorite_id) if @favorite_id.present?

    respond_to do |format|
      format.json do
        render json: {
          id: @favorite_id,
          name: @name,
          address: @address,
          latitude: @latitude,
          longitude: @longitude
        }
      end
      format.html { render :favorite, layout: "share" }
    end
  end
end
