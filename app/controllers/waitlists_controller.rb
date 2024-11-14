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

    def destroy
        waitlist = Waitlist.find_by(id: params[:id])
        if waitlist
            waitlist.destroy
            render json: pet 
        else
            render json: { error: "waitlist not found" }, status: :not_found
        end
    end

    private

    def waitlist_params
        params.require(:waitlist).permit(:name, :email)
    end
end