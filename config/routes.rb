Rails.application.routes.draw do
  resources :responses, only: [ :index, :create, :destroy ]
  resources :users, only: [ :index, :create, :destroy ]
  resources :activities, only: [ :create, :destroy, :update, :index, :show ] do
    resources :pinned_activities, only: [ :index, :create, :update, :destroy ]
  end
  resource :password_reset, only: [ :create, :update ]
  resources :activity_participants, only: [ :index ] do
    post :invite, on: :collection
  end
  resources :pinned_activities, only: [] do
    resources :comments, only: [ :index, :create ]
  end

  get "/verify", to: "users#verify"
  post "/resend_verification", to: "users#resend_verification"

  get "/invite_signup", to: "users#invite_signup_redirect"
  post "/activity_participants/accept", to: "activity_participants#accept"

  post "login", to: "sessions#create"
  delete "logout", to: "sessions#destroy"
  get "/me", to: "users#show"

  post "/api/openai/haiku", to: "openai#generate_haiku"
  post "/api/openai/restaurant_recommendations", to: "openai#restaurant_recommendations"
  get "/check_cached_recommendations", to: "openai#check_cached_recommendations"

  get "/test", to: "application#test"

  get "up" => "rails/health#show", as: :rails_health_check

  mount ActionCable.server => "/cable"

  get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker
  get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
end
