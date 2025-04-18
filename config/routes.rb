Rails.application.routes.draw do
  resources :responses, only: [ :index, :create, :destroy ]
  resources :users, only: [ :create, :destroy, :update ]
  resources :activities, only: [ :create, :destroy, :update, :index, :show ] do
    resources :pinned_activities, only: [ :index, :create, :update, :destroy ]
    resources :comments, only: [ :index, :create ]
  end
  resource :password_reset, only: [ :create, :update ]
  resources :activity_participants, only: [ :index ] do
    post :invite, on: :collection
  end
  resources :pinned_activities, only: [] do
    resources :comments, only: [ :index, :create ]
    resources :votes, only: [ :create, :destroy ]
  end
  resources :waitlists, only: [ :index, :show, :create, :update, :destroy ]

  get "/verify", to: "users#verify"
  post "/resend_verification", to: "users#resend_verification"

  get "/invite_signup", to: "users#invite_signup_redirect"
  post "/activity_participants/accept", to: "activity_participants#accept"
  post "/activity_participants/leave", to: "activity_participants#leave"

  post "login", to: "sessions#create"
  delete "logout", to: "sessions#destroy"
  get "/me", to: "users#show"

  post "/api/openai/haiku", to: "openai#generate_haiku"
  post "/api/openai/restaurant_recommendations", to: "openai#restaurant_recommendations"
  get "/check_cached_recommendations", to: "openai#check_cached_recommendations"
  post "/api/openai/trending_recommendations", to: "openai#trending_recommendations"

  post "/activities/:id/send_thank_you", to: "activities#send_thank_you"

  get "/test", to: "application#test"

  get "up" => "rails/health#show", as: :rails_health_check

  mount ActionCable.server => "/cable"

  get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker
  get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
end
