class WaitlistsController < ApplicationController
    before_action :authorized
    before_action :set_waitlist, only: [ :show, :update, :destroy ]
    skip_before_action :authorized, only: [ :create ]

    def index
      @waitlists = Waitlist.all
      render json: @waitlists
    end

    def show
      render json: @waitlist
    end

    def create
      @waitlist = Waitlist.new(waitlist_params)
      if @waitlist.save
        render json: @waitlist, status: :created
      else
        render json: { errors: @waitlist.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def update
      if @waitlist.update(waitlist_params)
        render json: @waitlist
      else
        render json: { errors: @waitlist.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def destroy
      @waitlist.destroy
      head :no_content
    end

    private

    def set_waitlist
      @waitlist = Waitlist.find(params[:id])
    end

    def waitlist_params
      params.require(:waitlist).permit(:name, :email, :product, :mobile)
    end
end
