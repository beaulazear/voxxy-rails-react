# app/controllers/contacts_controller.rb
class ContactsController < ApplicationController
    def index
      @contacts = Contact.all
      render json: @contacts
    end

    def show
      @contact = Contact.find(params[:id])
      render json: @contact
    end

    def create
      @contact = Contact.new(contact_params)
      if @contact.save
        render json: @contact, status: :created
      else
        render json: { errors: @contact.errors.full_messages }, status: :unprocessable_entity
      end
    end

    private

    def contact_params
      params.require(:contact).permit(:name, :email, :subject, :message)
    end
end
