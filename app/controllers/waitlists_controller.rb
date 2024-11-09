class WaitlistsController < ApplicationController
    skip_before_action :authorized

    def create
        waitlist = Waitlist.new(waitlist_params)
        if waitlist.save
            render json: waitlist, status: :created
        else 
            render json: { errors: waitlist.errors.full_messages }, status: :unprocessable_entity
        end
    end

    def index
        waitlist = Waitlist.all
        render json: waitlist, status: :ok
    end

    private

    def waitlist_params
        params.require(:waitlist).permit(:name, :email)
    end
end