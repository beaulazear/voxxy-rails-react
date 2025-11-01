# Auto-Comment Implementation for Group Activities

## Overview
Added automatic comments for two key milestones in group activities (non-solo activities only):
1. **Recommendations Generated** - When host generates AI recommendations
2. **Activity Finalized** - When host finalizes the group's plan

## Changes Made

### 1. Activities Controller (`app/controllers/activities_controller.rb`)

#### Added State Tracking (lines 46-50)
```ruby
# Track state transitions for auto-comments
is_generating_recommendations = activity_params.key?(:voting) &&
                                activity_params[:voting] == true &&
                                activity_params[:collecting] == false
is_finalizing = activity_params.key?(:finalized) && activity_params[:finalized] == true
```

#### Added Auto-Comment Creation (lines 84-102)
```ruby
# Auto-comment for recommendations generated (group activities only)
if is_generating_recommendations && !activity.is_solo
  comment = activity.comments.build(
    user_id: current_user.id,
    content: "#{current_user.name} has generated new recommendations for your group! ✨"
  )
  comment.skip_notifications = true
  comment.save!
end

# Auto-comment for activity finalized (group activities only)
if is_finalizing && !activity.is_solo
  comment = activity.comments.build(
    user_id: current_user.id,
    content: "#{current_user.name} has finalized your group's plan! 🎉"
  )
  comment.skip_notifications = true
  comment.save!
end
```

#### Updated Activity Reload (line 107)
```ruby
activity = Activity.includes(:user, :participants, :activity_participants, :responses, { comments: :user })
```

### 2. Activity Serializer (`app/serializers/activity_serializer.rb`)

#### Updated `updated` Method (line 21-29)
Added comments to the serializer response so auto-comments appear immediately without waiting for polling:
```ruby
def self.updated(activity)
  basic(activity).merge(
    # ... existing fields ...
    comments: activity.comments.map { |c| CommentSerializer.basic(c) }  # Added this line
  )
end
```

## How It Works

### Flow for Recommendations Generated
```
1. User clicks "Generate Recommendations" in mobile app
   ↓
2. Mobile app calls: PATCH /activities/{id}
   Body: { collecting: false, voting: true }
   ↓
3. Backend detects state transition
   ↓
4. Creates comment: "John has generated new recommendations for your group! ✨"
   - skip_notifications = true (no duplicate push notifications)
   ↓
5. Returns updated activity with new comment included
   ↓
6. Mobile app displays comment immediately in CommentsSection
```

### Flow for Activity Finalized
```
1. User finalizes activity in mobile app
   ↓
2. Mobile app calls: PATCH /activities/{id}
   Body: { finalized: true, voting: false, selected_pinned_activity_id: X }
   ↓
3. Backend detects finalized transition
   ↓
4. Creates comment: "John has finalized your group's plan! 🎉"
   - skip_notifications = true (finalization already sends custom notification)
   ↓
5. Returns updated activity with new comment included
   ↓
6. Mobile app displays comment immediately
```

## Important Notes

### Why `skip_notifications = true`?
- **For Recommendations**: Standard comment notifications would be redundant; the recommendation generation itself is the notable event
- **For Finalization**: Activity model already sends custom "activity_finalized" notifications to all participants (see Comment model `after_create` callback)

### Solo Activities
Auto-comments are **skipped** for solo activities (`is_solo: true`) since:
- No group to notify
- CommentsSection is hidden for solo activities in the UI
- Only makes sense in collaborative group context

### Existing Auto-Comments
These new auto-comments complement existing system messages:
- ✅ "User has joined the group 🎉" (participant joins)
- ✅ "User has left the group 😢" (participant leaves)
- ✅ "User has declined the invitation 😔" (invitation declined)

## Testing

### Test Case 1: Recommendations Generated
1. Create a group activity (not solo)
2. Have at least one participant submit preferences
3. As host, click "Generate Recommendations"
4. **Expected**: Comment appears: "{Your Name} has generated new recommendations for your group! ✨"

### Test Case 2: Activity Finalized
1. Generate recommendations for a group activity
2. Select a venue/location
3. As host, finalize the activity
4. **Expected**: Comment appears: "{Your Name} has finalized your group's plan! 🎉"

### Test Case 3: Solo Activity (No Auto-Comments)
1. Create a solo activity (`is_solo: true`)
2. Generate recommendations and finalize
3. **Expected**: NO auto-comments appear

### Test Case 4: Polling Picks Up Comments
1. Have multiple devices/users viewing the same activity
2. When host generates recommendations or finalizes
3. **Expected**: Other participants see the comment appear within 4 seconds (polling interval)

## API Response Example

When updating activity to voting phase:
```json
{
  "id": 123,
  "activity_name": "Team Dinner",
  "collecting": false,
  "voting": true,
  "is_solo": false,
  "comments": [
    {
      "id": 456,
      "content": "John Smith has generated new recommendations for your group! ✨",
      "created_at": "2025-11-01T19:30:00.000Z",
      "user": {
        "id": 789,
        "name": "John Smith",
        "avatar": "/uploads/john.jpg"
      }
    }
  ]
}
```

## Related Files
- `/app/controllers/activities_controller.rb` - Comment creation logic
- `/app/models/comment.rb` - Comment model with skip_notifications support
- `/app/serializers/activity_serializer.rb` - Include comments in response
- `/app/serializers/comment_serializer.rb` - Comment JSON format
- Mobile: `/components/CommentsSection.js` - Displays comments with polling
- Mobile: `/components/AIRecommendations.js` - Renders CommentsSection conditionally
