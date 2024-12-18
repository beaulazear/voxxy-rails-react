Rails.application.routes.draw do
  resources :waitlists
  resources :users, only: [ :index, :create, :destroy ]

  get "/verify", to: "users#verify"
  post "/resend_verification", to: "users#resend_verification"

  post "login", to: "sessions#create"
  delete "logout", to: "sessions#destroy"
  get "/me", to: "users#show"

  get "up" => "rails/health#show", as: :rails_health_check

  get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker
  get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
end
