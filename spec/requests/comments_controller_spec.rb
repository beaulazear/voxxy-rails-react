require 'rails_helper'

RSpec.describe CommentsController, type: :request do
  include ActiveSupport::Testing::TimeHelpers
  let(:user) { create(:user) }
  let(:activity) { create(:activity) }
  let(:pinned_activity) { create(:pinned_activity, activity: activity) }

  before do
    # Mock push notification service
    allow(PushNotificationService).to receive(:send_new_comment_notification)
  end

  describe 'POST /activities/:activity_id/comments' do
    let(:valid_params) do
      {
        comment: {
          content: 'This looks like a great activity!'
        }
      }
    end

    context 'when user is authenticated' do
      before { login_user(user) }

      it 'creates comment on activity' do
        expect {
          post "/activities/#{activity.id}/comments", 
               params: valid_params, 
               headers: auth_headers
        }.to change(Comment, :count).by(1)

        expect(response).to have_http_status(:created)
        
        comment = Comment.last
        expect(comment.content).to eq('This looks like a great activity!')
        expect(comment.user).to eq(user)
        expect(comment.activity).to eq(activity)
      end

      it 'returns comment with user data' do
        post "/activities/#{activity.id}/comments", 
             params: valid_params, 
             headers: auth_headers

        expect(response).to have_http_status(:created)
        
        json_response = JSON.parse(response.body)
        expect(json_response).to include(
          'content' => 'This looks like a great activity!',
          'user' => hash_including('id', 'name', 'email')
        )
      end

      it 'sends push notification to other participants' do
        post "/activities/#{activity.id}/comments", 
             params: valid_params, 
             headers: auth_headers

        comment = Comment.last
        expect(PushNotificationService).to have_received(:send_new_comment_notification)
          .with(comment)
      end

      context 'when commenting on a pinned activity (venue)' do
        let(:venue_comment_params) do
          {
            comment: {
              content: 'I love this restaurant!'
            },
            pinned_activity_id: pinned_activity.id
          }
        end

        it 'creates comment linked to pinned activity' do
          post "/activities/#{activity.id}/comments", 
               params: venue_comment_params, 
               headers: auth_headers

          expect(response).to have_http_status(:created)
          
          comment = Comment.last
          expect(comment.pinned_activity).to eq(pinned_activity)
          expect(comment.activity).to eq(activity)
        end
      end

      context 'with invalid parameters' do
        let(:invalid_params) do
          {
            comment: {
              content: ''
            }
          }
        end

        it 'returns validation errors' do
          expect {
            post "/activities/#{activity.id}/comments", 
                 params: invalid_params, 
                 headers: auth_headers
          }.not_to change(Comment, :count)

          expect(response).to have_http_status(:unprocessable_entity)
          expect(JSON.parse(response.body)).to include('error' => 'Failed to post comment.')
        end
      end

      context 'with missing content' do
        let(:missing_content_params) do
          {
            comment: {}
          }
        end

        it 'returns validation error' do
          post "/activities/#{activity.id}/comments", 
               params: missing_content_params, 
               headers: auth_headers

          expect(response).to have_http_status(:bad_request)
        end
      end
    end

    context 'when activity does not exist' do
      before { login_user(user) }

      it 'returns not found' do
        post '/activities/999999/comments', 
             params: valid_params, 
             headers: auth_headers

        expect(response).to have_http_status(:not_found)
        expect(JSON.parse(response.body)).to include('error' => 'Activity not found')
      end
    end

    context 'when user is not authenticated' do
      it 'returns unauthorized' do
        post "/activities/#{activity.id}/comments", params: valid_params

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'GET /activities/:activity_id/comments' do
    let!(:comment1) { create(:comment, activity: activity, content: 'First comment') }
    let!(:comment2) { create(:comment, activity: activity, content: 'Second comment') }

    context 'when user is authenticated' do
      before { login_user(user) }

      it 'returns all comments for activity' do
        get "/activities/#{activity.id}/comments", headers: auth_headers

        expect(response).to have_http_status(:ok)
        
        json_response = JSON.parse(response.body)
        expect(json_response.length).to eq(2)
        
        contents = json_response.map { |c| c['content'] }
        expect(contents).to include('First comment', 'Second comment')
      end

      it 'includes user data with comments' do
        get "/activities/#{activity.id}/comments", headers: auth_headers

        json_response = JSON.parse(response.body)
        comment_json = json_response.first
        
        expect(comment_json['user']).to include('id', 'name', 'avatar')
        expect(comment_json['user']).not_to include('email', 'password_digest')
      end
    end

    context 'when activity does not exist' do
      before { login_user(user) }

      it 'returns not found' do
        get '/activities/999999/comments', headers: auth_headers

        expect(response).to have_http_status(:not_found)
        expect(JSON.parse(response.body)).to include('error')
      end
    end

    context 'when user is not authenticated' do
      it 'returns unauthorized' do
        get "/activities/#{activity.id}/comments"

        expect(response).to have_http_status(:unauthorized)
      end
    end
  end

  describe 'GET /pinned_activities/:pinned_activity_id/comments' do
    let!(:venue_comment) { create(:comment, pinned_activity: pinned_activity, activity: activity) }

    context 'when user is authenticated' do
      before { login_user(user) }

      it 'returns comments for pinned activity' do
        get "/pinned_activities/#{pinned_activity.id}/comments", headers: auth_headers

        expect(response).to have_http_status(:ok)
        
        json_response = JSON.parse(response.body)
        expect(json_response.length).to eq(1)
        expect(json_response.first['id']).to eq(venue_comment.id)
      end
    end

    context 'when pinned activity does not exist' do
      before { login_user(user) }

      it 'returns not found' do
        get '/pinned_activities/999999/comments', headers: auth_headers

        expect(response).to have_http_status(:not_found)
      end
    end
  end

  describe 'comment notifications behavior' do
    let(:host) { activity.user }
    let(:participant1) { create(:user, :with_push_token) }
    let(:participant2) { create(:user, :with_push_token) }
    let(:commenter) { create(:user, :with_push_token) }

    before do
      # Set up activity participants
      activity.activity_participants.create!(
        user: participant1,
        invited_email: participant1.email,
        accepted: true
      )
      activity.activity_participants.create!(
        user: participant2,
        invited_email: participant2.email,
        accepted: true
      )

      login_user(commenter)
    end

    it 'triggers notification for all participants except commenter' do
      post "/activities/#{activity.id}/comments", 
           params: { comment: { content: 'Great activity!' } }, 
           headers: auth_headers

      expect(PushNotificationService).to have_received(:send_new_comment_notification) do |comment|
        expect(comment.user).to eq(commenter)
        expect(comment.activity).to eq(activity)
        expect(comment.content).to eq('Great activity!')
      end
    end
  end

  describe 'comment content validation' do
    before { login_user(user) }

    it 'accepts various content formats' do
      content_types = [
        'Simple comment',
        'Comment with emojis! 🎉 😊',
        'Multi-line\ncomment\nwith breaks',
        'Comment with special chars: @#$%^&*()',
        'A' * 1000 # Long comment
      ]

      content_types.each do |content|
        post "/activities/#{activity.id}/comments", 
             params: { comment: { content: content } }, 
             headers: auth_headers

        expect(response).to have_http_status(:created), 
               "Content '#{content[0..20]}...' should be valid"
      end
    end

    it 'rejects empty or whitespace-only content' do
      ['', '   ', "\n\n", "\t\t"].each do |invalid_content|
        post "/activities/#{activity.id}/comments", 
             params: { comment: { content: invalid_content } }, 
             headers: auth_headers

        expect(response).to have_http_status(:unprocessable_entity),
               "Content '#{invalid_content}' should be invalid"
      end
    end
  end

  describe 'comment ordering' do
    before { login_user(user) }

    it 'returns comments in creation order' do
      # Create comments with slight delays to ensure different timestamps
      first_comment = create(:comment, activity: activity, content: 'First')
      
      travel 1.minute do
        second_comment = create(:comment, activity: activity, content: 'Second')
      end

      get "/activities/#{activity.id}/comments", headers: auth_headers

      json_response = JSON.parse(response.body)
      contents = json_response.map { |c| c['content'] }
      
      # Comments should be ordered by creation time
      expect(contents.first).to eq('First')
      expect(contents.last).to eq('Second')
    end
  end

  describe 'security and authorization' do
    let(:activity_owner) { activity.user }
    let(:participant) { create(:user) }
    let(:non_participant) { create(:user) }

    before do
      activity.activity_participants.create!(
        user: participant,
        invited_email: participant.email,
        accepted: true
      )
    end

    it 'allows activity owner to comment' do
      login_user(activity_owner)
      
      post "/activities/#{activity.id}/comments", 
           params: { comment: { content: 'Host comment' } }, 
           headers: auth_headers

      expect(response).to have_http_status(:created)
    end

    it 'allows participants to comment' do
      login_user(participant)
      
      post "/activities/#{activity.id}/comments", 
           params: { comment: { content: 'Participant comment' } }, 
           headers: auth_headers

      expect(response).to have_http_status(:created)
    end

    it 'allows non-participants to comment (open discussion)' do
      login_user(non_participant)
      
      post "/activities/#{activity.id}/comments", 
           params: { comment: { content: 'Non-participant comment' } }, 
           headers: auth_headers

      # Based on current implementation, non-participants can comment
      expect(response).to have_http_status(:created)
    end
  end
end