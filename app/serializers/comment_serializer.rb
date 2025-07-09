# app/serializers/comment_serializer.rb
class CommentSerializer < BaseSerializer
  def self.basic(comment)
    {
      id: comment.id,
      content: comment.content,
      created_at: comment.created_at,
      user: user_minimal(comment.user)
    }
  end
end
