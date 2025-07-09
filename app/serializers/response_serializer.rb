# app/serializers/response_serializer.rb
class ResponseSerializer < BaseSerializer
  def self.basic(response)
    {
      id: response.id,
      notes: response.notes,
      availability: response.availability,
      created_at: response.created_at,
      user_id: response.user_id,
      email: response.email,
      activity_id: response.activity_id
    }
  end

  def self.for_activity(responses)
    responses.map { |r| basic(r) }
  end
end
