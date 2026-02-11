Rails.application.routes.draw do
  # LEGACY ROUTES (Temporary - for backward compatibility)
  # These routes support existing mobile clients that haven't migrated to /api/v1/mobile/*
  # TODO: Deprecate after mobile clients update to use versioned API

  # Analytics (legacy)
  namespace :analytics do
    post :track
    post :identify
    post :page_view
  end

  # Auth routes (legacy - will move to /api/v1/shared/*)
  post "login", to: "sessions#create"
  post "dev_login", to: "dev_login#create" # Development-only bypass
  delete "logout", to: "sessions#destroy"
  get "/me", to: "users#show"

  # User routes (legacy)
  resources :users, only: [ :create, :destroy, :update ]
  get "/verify", to: "users#verify"
  post "/verify_code", to: "users#verify_code"
  post "/resend_verification", to: "users#resend_verification"
  patch "/make_admin", to: "users#make_admin"
  post "/accept_policies", to: "users#accept_policies"
  get "/users/:id/pending_invitations", to: "users#pending_invitations"
  post "/users/:id/update_push_token", to: "users#update_push_token"
  get "/users/:id/push_token_status", to: "users#push_token_status"

  # User blocking (legacy)
  post "/users/:id/block", to: "blocks#create"
  delete "/users/:id/unblock", to: "blocks#destroy"
  get "/users/blocked", to: "blocks#index"

  # Password reset (legacy)
  resource :password_reset, only: [ :create, :update ]

  # Activities (legacy)
  resources :activities, only: [ :create, :destroy, :update, :index, :show ] do
    member do
      get :share
      get :calendar, defaults: { format: "ics" }
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

  post "/activities/:id/send_thank_you", to: "activities#send_thank_you"
  post "/activities/:id/mark_complete", to: "activities#mark_complete"

  # Activity participants (legacy)
  resources :activity_participants, only: [ :index ] do
    post :invite, on: :collection
  end
  get "/invite_signup", to: "users#invite_signup_redirect"
  post "/activity_participants/accept", to: "activity_participants#accept"
  delete "/activity_participants/decline", to: "activity_participants#decline"
  post "/activity_participants/leave", to: "activity_participants#leave"
  delete "/activity_participants/remove", to: "activity_participants#destroy_by_email"

  # Responses (legacy)
  resources :responses, only: [ :index, :create, :destroy ]

  # Guest responses (legacy)
  get "/activities/:activity_id/respond/:token", to: "guest_responses#show"
  post "/activities/:activity_id/respond/:token", to: "guest_responses#create"
  post "/activities/:activity_id/respond/:token/accept_with_preferences", to: "guest_responses#accept_with_profile_preferences"

  # Pinned activities & votes (legacy)
  resources :pinned_activities, only: [] do
    resources :comments, only: [ :index, :create ]
    resources :votes, only: [ :create, :destroy ]
    member do
      post :toggle_flag, to: "user_activities#toggle_flag"
      post :toggle_favorite, to: "user_activities#toggle_favorite"
    end
  end

  # User activities (legacy)
  resources :user_activities, only: [ :index, :destroy ] do
    collection do
      get :flagged
      get :favorited
      get :community_feed
    end
  end

  # Notifications (legacy)
  resources :notifications, only: [ :index, :show, :create, :destroy ] do
    member do
      put :mark_as_read, to: "notifications#mark_as_read"
    end
    collection do
      put :mark_all_as_read, to: "notifications#mark_all_as_read"
    end
  end
  post "/test_notification", to: "notifications#test"
  post "/send_test_to_self", to: "notifications#send_test_to_self"

  # OpenAI recommendations (legacy)
  post "/api/openai/restaurant_recommendations", to: "openai#restaurant_recommendations"
  post "/api/openai/bar_recommendations", to: "openai#bar_recommendations"
  post "/api/openai/game_recommendations", to: "openai#game_recommendations"
  post "/try_voxxy_recommendations", to: "openai#try_voxxy_recommendations"
  get "/try_voxxy_cached", to: "openai#try_voxxy_cached"

  # Places API (legacy)
  get "/api/places/photo/:photo_reference", to: "places#photo",
      constraints: { photo_reference: /[^\/]+/ },
      as: "places_photo"
  get "/api/places/search", to: "places#search"
  get "/api/places/details", to: "places#details"
  get "/api/places/reverse_geocode", to: "places#reverse_geocode"

  # Photos (legacy)
  get "/photos/:photo_reference", to: "photos#show",
      constraints: { photo_reference: /[^\/]+/ },
      as: "photo"

  # Share routes (legacy)
  get "share/favorite/:id", to: "share#favorite", as: :share_favorite

  # Reports & moderation (legacy)
  resources :reports, only: [ :index, :create, :show ] do
    member do
      patch :review
      patch :resolve
      patch :dismiss
    end
    collection do
      get :stats
    end
  end

  # Marketing forms (legacy)
  resources :waitlists, only: [ :index, :show, :create, :update, :destroy ]
  resources :feedbacks, only: [ :index, :show, :create ]
  resources :contacts, only: [ :index, :show, :create ]

  # VERSIONED API ROUTES (New structure)

  namespace :api do
    namespace :v1 do
      # SendGrid webhook for email event tracking
      post "sendgrid/webhook", to: "sendgrid_webhooks#event"

      # MOBILE PRODUCT ROUTES
      # All routes for the existing Voxxy mobile app
      # Mobile clients should migrate to these routes from legacy routes above

      namespace :mobile do
        # Activities
        resources :activities do
          member do
            get :share
            get :calendar, defaults: { format: "ics" }
            post :send_test_reminder
            post :send_thank_you
            post :mark_complete
          end

          collection do
            get :ai_recommendations
          end

          resources :pinned_activities
          resources :comments
          resources :time_slots do
            collection do
              get :ai_recommendations
            end
            member do
              post :vote
              post :unvote
            end
          end
        end

        # Activity participants
        resources :activity_participants do
          collection do
            post :invite
            get :pending_invitations
          end
          member do
            post :accept
            post :decline
            post :leave
          end
        end

        # Responses
        resources :responses

        # Guest responses
        get "/activities/:activity_id/respond/:token", to: "guest_responses#show"
        post "/activities/:activity_id/respond/:token", to: "guest_responses#create"
        post "/activities/:activity_id/respond/:token/accept_with_preferences", to: "guest_responses#accept_with_profile_preferences"

        # Votes
        resources :votes

        # User activities (saved/favorited places)
        resources :user_activities do
          collection do
            get :flagged
            get :favorited
            get :community_feed
          end
          member do
            post :toggle_flag
            post :toggle_favorite
          end
        end

        # Notifications
        resources :notifications do
          member do
            put :mark_as_read
          end
          collection do
            put :mark_all_as_read
            post :test
            post :send_test_to_self
          end
        end

        # OpenAI recommendations
        post "/openai/restaurant_recommendations", to: "openai#restaurant_recommendations"
        post "/openai/bar_recommendations", to: "openai#bar_recommendations"
        post "/openai/game_recommendations", to: "openai#game_recommendations"
        post "/openai/try_voxxy_recommendations", to: "openai#try_voxxy_recommendations"
        get "/openai/try_voxxy_cached", to: "openai#try_voxxy_cached"

        # Places API proxy
        namespace :places do
          get "photo/:photo_reference", to: "places#photo", constraints: { photo_reference: /[^\/]+/ }
          get "search", to: "places#search"
          get "details", to: "places#details"
          get "reverse_geocode", to: "places#reverse_geocode"
        end

        # Reports & moderation
        resources :reports do
          member do
            patch :review
            patch :resolve
            patch :dismiss
          end
          collection do
            get :stats
          end
        end
      end

      # PRESENTS PRODUCT ROUTES (NEW)
      # All routes for the new Voxxy Presents venue/events product

      namespace :presents do
        # Current user's organization
        get "me/organization", to: "organizations#my_organization"

        # Organizations (venues/clubs)
        resources :organizations do
          resources :events, only: [ :index, :create ]
          resources :budgets, only: [ :index, :create ]
          resources :vendor_contacts, only: [ :index ] do
            collection do
              get :ids
            end
          end
          resources :contact_lists, only: [ :index, :create ]

          # Organization-level integrations
          post "integrations/eventbrite/connect", to: "organization_integrations#connect_eventbrite"
          delete "integrations/eventbrite/disconnect", to: "organization_integrations#disconnect_eventbrite"
          get "integrations/eventbrite/status", to: "organization_integrations#eventbrite_status"
          get "integrations/eventbrite/events", to: "organization_integrations#eventbrite_events"
        end

        # Contact Lists
        resources :contact_lists, only: [ :show, :update, :destroy ] do
          member do
            get :contacts
          end
        end

        # Events
        resources :events do
          resources :registrations, only: [ :index, :create ]
          resources :budgets, only: [ :index, :create ]
          resources :vendor_applications, only: [ :index, :create ]
          resources :invitations, controller: :event_invitations, only: [ :index ] do
            collection do
              post :batch, action: :create_batch
              get :preview_email
            end
          end
          resources :bulletins, only: [ :index, :create ]

          # Payment integrations (Eventbrite, Stripe, etc.)
          resources :payment_integrations, only: [ :index, :create, :update, :destroy ] do
            member do
              post :sync
            end
          end

          # Payment transactions
          resources :payment_transactions, only: [ :index, :show ] do
            member do
              patch :match
            end
          end

          # Email notification endpoints for events
          post "email_notifications/check_event_update_impact", to: "email_notifications#check_event_update_impact"
          post "email_notifications/send_event_update", to: "email_notifications#send_event_update_emails"
          post "email_notifications/check_cancellation_impact", to: "email_notifications#check_cancellation_impact"
          post "email_notifications/send_cancellation", to: "email_notifications#send_cancellation_emails"

          # Go live action - sends invitations and activates scheduled emails
          member do
            post :go_live
          end
        end

        # Bulletins (producer announcements)
        resources :bulletins, only: [ :show, :update, :destroy ] do
          member do
            post :toggle_pin
            post :mark_read
          end
        end

        # Public invitation endpoints (no auth required)
        get "invitations/:token", to: "event_invitations#show_by_token"
        patch "invitations/:token/respond", to: "event_invitations#respond"
        get "invitations/prefill/:token", to: "event_invitations#prefill"

        # Public event portal endpoints (no auth required)
        post "portals/verify", to: "event_portals#verify_access"
        get "portals/token/:access_token", to: "event_portals#show_by_token"
        get "portals/:event_slug", to: "event_portals#show_by_slug"  # Legacy: keep for backward compatibility

        # Vendors (marketplace)
        resources :vendors do
          collection do
            get :search
          end
        end

        # Vendor Contacts (CRM)
        resources :vendor_contacts do
          collection do
            post :bulk_import
          end
          member do
            post :record_interaction
            post :add_tag
            delete :remove_tag
          end
        end

        # Vendor Applications (vendor application forms)
        resources :vendor_applications, only: [ :show, :update, :destroy ] do
          collection do
            get "lookup/:code", action: :lookup_by_code, as: :lookup
          end
          member do
            get :submissions
          end
        end

        # Budgets
        resources :budgets do
          resources :budget_line_items
        end

        # Registrations (event RSVPs and vendor applications)
        resources :registrations, only: [ :show, :update ] do
          collection do
            get "track/:ticket_code", action: :track, as: :track
          end

          # Email notification endpoints for registrations
          member do
            post "email_notifications/send_payment_confirmation", to: "email_notifications#send_payment_confirmation"
            post "email_notifications/send_category_change", to: "email_notifications#send_category_change"
          end
        end

        # Email Automation
        resources :email_campaign_templates do
          member do
            post :clone
          end
          resources :email_template_items do
            member do
              patch :reorder
            end
          end
        end

        # Scheduled emails nested under events
        resources :events, only: [] do
          resources :scheduled_emails, only: [ :index, :show, :update, :destroy ] do
            collection do
              post :generate
            end
            member do
              post :pause
              post :resume
              post :send_now
              post :preview
              post :retry_failed
              get :recipients
            end
          end
        end

        # Email testing (venue owners only - 10 emails total)
        resources :email_tests, only: [ :index ] do
          collection do
            post :send_scheduled           # 7 scheduled emails
            post :send_notification_emails # 3 notification emails
            post :send_all                 # All 10 emails
          end
        end

        # Public unsubscribe endpoints (no auth required - token-based security)
        get "unsubscribe/:token", to: "unsubscribes#show"
        post "unsubscribe/:token", to: "unsubscribes#create"
        post "unsubscribe/:token/resubscribe", to: "unsubscribes#resubscribe"
      end

      # Webhooks (outside presents namespace - public endpoint)
      namespace :webhooks do
        post :sendgrid, to: "sendgrid#create"
      end

      # SHARED ROUTES
      # Routes accessible by both Mobile and Presents products

      namespace :shared do
        # Authentication
        post "/login", to: "sessions#create"
        delete "/logout", to: "sessions#destroy"
        get "/me", to: "users#me"

        # User management
        resources :users, only: [ :create, :show, :update ] do
          member do
            post :verify_email
            post :resend_verification
            post :update_push_token
            get :push_token_status
            post :block
            delete :unblock
          end
          collection do
            get :blocked
          end
        end

        # Password reset
        post "/password_reset", to: "password_resets#create"
        patch "/password_reset", to: "password_resets#update"

        # Notifications
        resources :notifications, only: [ :index, :show ] do
          member do
            put :mark_as_read
          end
          collection do
            put :mark_all_as_read
          end
        end

        # Analytics
        namespace :analytics do
          post :track
          post :identify
          post :page_view
        end

        # Bug Reports (public endpoint for user submissions, admin endpoints require auth)
        resources :bug_reports, only: [ :index, :show, :create ]
      end

      # PRESENTS PRODUCT ROUTES (NEW)
      # All routes for the new Voxxy Presents venue/events product

      namespace :presents do
      end
    end
  end

  # ADMIN ROUTES

  get "/admin/analytics", to: "admin#analytics"
  get "/admin/admin_users", to: "admin#admin_users"
  get "/admin/user_breakdown", to: "admin#user_breakdown"
  get "/admin/unconfirmed_users", to: "admin#unconfirmed_users"
  get "/admin/presents_analytics", to: "admin#presents_analytics"
  get "/admin/flagged_restaurants", to: "admin#flagged_restaurants"

  namespace :admin do
    resources :moderation_actions, only: [ :index ]
    resources :reports, only: [ :index ] do
      collection do
        get :overdue
      end
    end
    resources :users, only: [] do
      member do
        post :suspend
        post :unsuspend
        post :ban
        post :unban
      end
    end

    # Email testing (admin only - all 21 emails)
    resources :emails, only: [ :index ] do
      collection do
        post :send_all
        post :send_scheduled
        post :setup_test_data
        delete :cleanup_test_data
        post :preview
      end
    end
  end

  # SYSTEM ROUTES

  get "/test", to: "application#test"
  get "up" => "rails/health#show", as: :rails_health_check
  get "/health", to: "health#show"  # Comprehensive health check for monitoring

  # Dynamic robots.txt (blocks voxxyai.com from search engines)
  get "/robots.txt", to: "robots#show", defaults: { format: :text }

  # Sitemap for SEO
  get "/sitemap.xml", to: "sitemap#show", defaults: { format: :xml }

  mount ActionCable.server => "/cable"

  # Sidekiq Web UI (for monitoring background jobs)
  require "sidekiq/web"
  mount Sidekiq::Web => "/sidekiq"

  # PWA routes
  get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker
  get "manifest" => "rails/pwa#manifest", as: :pwa_manifest
end
