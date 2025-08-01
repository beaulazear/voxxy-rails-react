Rails.application.routes.draw do
  resources :responses, only: [ :index, :create, :destroy ]
  resources :users, only: [ :create, :destroy, :update ]
  resources :activities, only: [ :create, :destroy, :update, :index, :show ] do
    member do
      get :share
    end
    member do
      get :calendar, defaults: { format: "ics" }
    end
    member do
      post :send_test_reminder
    end
    resources :pinned_activities, only: [ :index, :create, :update, :destroy ]
    resources :comments, only: [ :index, :create ]
    resources :time_slots, only: [ :index, :create, :destroy ] do
      collection do
        get :ai_recommendations
      end
      member do
        post :vote
        post :unvote
      end
    end
  end
  resource :password_reset, only: [ :create, :update ]
  resources :activity_participants, only: [ :index ] do
    post :invite, on: :collection
  end
  resources :pinned_activities, only: [] do
    resources :comments, only: [ :index, :create ]
    resources :votes, only: [ :create, :destroy ]
    member do
      post :toggle_flag, to: "user_activities#toggle_flag"
      post :toggle_favorite, to: "user_activities#toggle_favorite"
    end
  end

  resources :user_activities, only: [ :index, :destroy ] do
    collection do
      get :flagged
      get :favorited
    end
  end
  resources :waitlists, only: [ :index, :show, :create, :update, :destroy ]
  resources :feedbacks, only: [ :index, :show, :create ]
  resources :contacts, only: [ :index, :show, :create ]
  resources :bug_reports, only: [ :index, :show, :create ]

  get "/verify", to: "users#verify"
  post "/resend_verification", to: "users#resend_verification"

  get "/invite_signup", to: "users#invite_signup_redirect"
  post "/activity_participants/accept", to: "activity_participants#accept"
  delete "/activity_participants/decline", to: "activity_participants#decline"
  post "/activity_participants/leave", to: "activity_participants#leave"
  delete "/activity_participants/remove", to: "activity_participants#destroy_by_email"

  post "login", to: "sessions#create"
  delete "logout", to: "sessions#destroy"
  get "/me", to: "users#show"
  patch "/make_admin", to: "users#make_admin"
  get "/admin/analytics", to: "admin#analytics"
  get "/admin/admin_users", to: "admin#admin_users"
  get "/admin/user_breakdown", to: "admin#user_breakdown"
  get "/admin/unconfirmed_users", to: "admin#unconfirmed_users"

  post "/api/openai/restaurant_recommendations", to: "openai#restaurant_recommendations"
  post "/api/openai/bar_recommendations", to: "openai#bar_recommendations"
  post "/api/openai/game_recommendations", to: "openai#game_recommendations"

  post "/try_voxxy_recommendations", to: "openai#try_voxxy_recommendations"
  get "/try_voxxy_cached",         to: "openai#try_voxxy_cached"

  get "/users/:id/pending_invitations", to: "users#pending_invitations"

  post "/activities/:id/send_thank_you", to: "activities#send_thank_you"
  post "/activities/:id/mark_complete", to: "activities#mark_complete"

  get "/activities/:activity_id/respond/:token", to: "guest_responses#show"
  post "/activities/:activity_id/respond/:token", to: "guest_responses#create"

  # Push Notification Routes
  post "/users/:id/update_push_token", to: "users#update_push_token"
  post "/test_notification", to: "notifications#test"
  post "/send_test_to_self", to: "notifications#send_test_to_self"  # Add this new route

  get "/photos/:photo_reference", to: "photos#show",
      constraints: { photo_reference: /[^\/]+/ },
      as: "photo"

  # Places API proxy for secure photo access
  get "/api/places/photo/:photo_reference", to: "places#photo",
      constraints: { photo_reference: /[^\/]+/ },
      as: "places_photo"

  get "/test", to: "application#test"

  get "up" => "rails/health#show", as: :rails_health_check

  mount ActionCable.server => "/cable"

  # Mount Sidekiq Web UI (optional - for monitoring background jobs)
  require "sidekiq/web"
  mount Sidekiq::Web => "/sidekiq"

  get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker
  get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
end
