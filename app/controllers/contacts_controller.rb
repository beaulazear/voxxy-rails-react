# app/controllers/contacts_controller.rb
class ContactsController < ApplicationController
  skip_before_action :authorized, only: [ :create ]

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
        SubmissionNotifierService.notify(:contact, @contact)
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
