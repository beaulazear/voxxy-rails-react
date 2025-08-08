# Shared configuration for activity types
module ActivityConfig
  ACTIVITY_TYPES = {
    "Restaurant" => { emoji: "🍜", display: "Lets Eat!", description: "Let's Eat! Schedule your next group meal together." },
    "Meeting" => { emoji: "⏰", display: "Lets Meet!", description: "Let's Meet! Find a time that works for everyone." },
    "Game Night" => { emoji: "🎮", display: "Game Time!", description: "Game Night! Set up a memorable game night." },
    "Cocktails" => { emoji: "🍸", display: "Lets Go Out!", description: "Night Out! Plan your perfect night out with friends." }
  }.freeze

  DEFAULT_CONFIG = { emoji: "🎉", display: "Lets Meet!", description: "Join this activity!" }.freeze

  def self.get(activity_type)
    ACTIVITY_TYPES[activity_type] || DEFAULT_CONFIG
  end

  def self.emoji_for(activity_type)
    get(activity_type)[:emoji]
  end

  def self.display_for(activity_type)
    get(activity_type)[:display]
  end

  def self.description_for(activity_type)
    get(activity_type)[:description]
  end
end
