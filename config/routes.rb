Rails.application.routes.draw do
  resources :users, only: [ :index, :create, :destroy ]
  resources :activities, only: [ :create, :destroy, :update ]
  resource :password_reset, only: [ :create, :update ]

  get "/verify", to: "users#verify"
  post "/resend_verification", to: "users#resend_verification"

  post "login", to: "sessions#create"
  delete "logout", to: "sessions#destroy"
  get "/me", to: "users#show"

  post "/api/openai/haiku", to: "openai#generate_haiku"

  get "up" => "rails/health#show", as: :rails_health_check

  mount ActionCable.server => "/cable"

  get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker
  get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
end
