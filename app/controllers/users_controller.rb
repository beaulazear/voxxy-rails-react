class UsersController < ApplicationController
    before_action :current_user

    skip_before_action :authorized, only: [:create, :index]

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

    def show
      user = @current_user
      if user
          render json: user
      else
          render json: { error: "Not authorized" }, status: :unauthorized
      end
    end
  
    private
  
    def user_params
      params.require(:user).permit(:name, :username, :email, :password)
    end
  end