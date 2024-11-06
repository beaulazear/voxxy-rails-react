class UsersController < ApplicationController
    def index
      users = User.all
      render json: users
    end
  
    def create
      user = User.create(user_params)
      if user.valid?
        render json: user, status: :created
      else
        render json: user.errors, status: :unprocessable_entity
      end
    end
  
    def destroy
      user = User.find(params[:id])
      user.destroy
      head :no_content
    end
  
    private
  
    def user_params
      params.require(:user).permit(:name)
    end
  end