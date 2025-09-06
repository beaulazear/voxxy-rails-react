class ContentFilterService
  # Comprehensive list of inappropriate words/phrases
  # This matches what your mobile app filters
  PROFANITY_PATTERNS = [
    # Explicit profanity
    /\bf+u+c+k+/i, /\bs+h+i+t+/i, /\ba+s+s+h+o+l+e+/i, /\bb+i+t+c+h+/i,
    /\bc+u+n+t+/i, /\bd+a+m+n+/i, /\bd+i+c+k+/i, /\bp+u+s+s+y+/i,
    /\bc+o+c+k+/i, /\bp+e+n+i+s+/i, /\bv+a+g+i+n+a+/i, /\bn+i+g+g+/i,
    /\bf+a+g+/i, /\br+e+t+a+r+d+/i, /\bw+h+o+r+e+/i, /\bs+l+u+t+/i,

    # Hate speech patterns
    /kill\s+(yourself|urself|ur\s*self)/i,
    /kys\b/i,
    /hate\s+(you|u)\b/i,
    /go\s+die\b/i,

    # Threats
    /i('ll|will)\s+kill\s+you/i,
    /i('ll|will)\s+find\s+you/i,
    /threat/i,

    # Sexual content
    /\bsex+y?\b/i,
    /\bnude?s?\b/i,
    /\bporn+o?\b/i,
    /\berotic\b/i,
    /\bhook\s*up\b/i,
    /\bdtf\b/i,
    /\bnsfw\b/i,

    # Drug references
    /\bweed\b/i,
    /\b420\b/,
    /\bcocaine\b/i,
    /\bmeth\b/i,
    /\bheroin\b/i,
    /\bdrugs?\b/i,
    /\bhigh\b/i,
    /\bstoned\b/i
  ]

  # Spam patterns
  SPAM_PATTERNS = [
    # URLs and links
    /http[s]?:\/\/(?!voxxyai\.com)/i,  # Allow only voxxyai.com links
    /bit\.ly/i,
    /tinyurl/i,
    /goo\.gl/i,

    # Common spam phrases
    /click\s+here/i,
    /buy\s+now/i,
    /limited\s+time\s+offer/i,
    /act\s+now/i,
    /call\s+now/i,
    /free\s+money/i,
    /make\s+money/i,
    /work\s+from\s+home/i,
    /congratulations/i,
    /you('ve)?\s+won/i,
    /claim\s+your/i,
    /verify\s+your\s+account/i,

    # Phone numbers (except emergency)
    /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/,

    # Excessive caps (more than 50% caps)
    # Handled in method below

    # Repetitive characters
    /(.)\1{5,}/,  # Same character repeated 6+ times

    # Email harvesting
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/
  ]

  class << self
    def clean(text)
      return "" if text.nil?

      cleaned_text = text.dup

      # Replace profanity with asterisks
      PROFANITY_PATTERNS.each do |pattern|
        cleaned_text.gsub!(pattern) do |match|
          first_char = match[0]
          last_char = match[-1]
          middle_asterisks = "*" * (match.length - 2)
          "#{first_char}#{middle_asterisks}#{last_char}"
        end
      end

      cleaned_text
    end

    def contains_profanity?(text)
      return false if text.nil? || text.empty?

      PROFANITY_PATTERNS.any? { |pattern| text.match?(pattern) }
    end

    def contains_spam?(text)
      return false if text.nil? || text.empty?

      # Check spam patterns
      return true if SPAM_PATTERNS.any? { |pattern| text.match?(pattern) }

      # Check for excessive caps (more than 50% capitals)
      letters_only = text.gsub(/[^a-zA-Z]/, "")
      if letters_only.length > 10
        caps_ratio = letters_only.count("A-Z").to_f / letters_only.length
        return true if caps_ratio > 0.5
      end

      # Check for too many URLs
      url_count = text.scan(/http[s]?:\/\//).size
      return true if url_count > 2

      false
    end

    def inappropriate?(text)
      contains_profanity?(text) || contains_spam?(text)
    end

    def validation_errors(text)
      errors = []

      errors << "contains inappropriate language" if contains_profanity?(text)
      errors << "appears to be spam" if contains_spam?(text)
      errors << "is too short" if text.to_s.strip.length < 1
      errors << "is too long (max 500 characters)" if text.to_s.length > 500

      errors
    end

    def safe?(text)
      !inappropriate?(text)
    end

    # For reports - determine severity
    def severity_level(text)
      return :none if text.nil? || text.empty?

      # Check for severe violations (immediate ban)
      severe_patterns = [
        /kill\s+(yourself|urself)/i,
        /\bn+i+g+g+/i,
        /\bf+a+g+/i,
        /threat/i
      ]

      return :severe if severe_patterns.any? { |pattern| text.match?(pattern) }
      return :moderate if contains_profanity?(text)
      return :mild if contains_spam?(text)

      :none
    end
  end
end
