namespace :redis do
  desc "Check Redis health and configuration"
  task health: :environment do
    puts "\n=== Redis Health Check ==="
    puts "=" * 50

    # Check Redis connection
    begin
      redis_url = ENV.fetch("REDIS_URL", "redis://localhost:6379/0")
      redis = Redis.new(url: redis_url)

      puts "✓ Redis URL: #{redis_url}"
      puts "✓ Redis PING: #{redis.ping}"

      # Get Redis info
      info = redis.info
      puts "\n📊 Redis Server Info:"
      puts "  Version: #{info['redis_version']}"
      puts "  Uptime: #{info['uptime_in_days']} days"
      puts "  Connected clients: #{info['connected_clients']}"
      puts "  Used memory: #{(info['used_memory_human'] || info['used_memory'])}"
      puts "  Peak memory: #{(info['used_memory_peak_human'] || info['used_memory_peak'])}"

    rescue => e
      puts "✗ Redis connection failed: #{e.message}"
      puts "  Make sure Redis is running and REDIS_URL is set correctly"
      exit 1
    end

    # Check Sidekiq
    puts "\n📦 Sidekiq Configuration:"
    begin
      require "sidekiq/api"
      stats = Sidekiq::Stats.new
      puts "  ✓ Sidekiq can connect to Redis"
      puts "  Processed jobs: #{stats.processed}"
      puts "  Failed jobs: #{stats.failed}"
      puts "  Queue size: #{stats.enqueued}"
      puts "  Retry size: #{stats.retry_size}"
      puts "  Dead size: #{stats.dead_size}"
    rescue => e
      puts "  ✗ Sidekiq check failed: #{e.message}"
    end

    # Check Rails cache
    puts "\n💾 Rails Cache Configuration:"
    if Rails.env.production?
      puts "  Cache store: #{Rails.cache.class}"
      puts "  ✓ Using Redis for caching" if Rails.cache.is_a?(ActiveSupport::Cache::RedisCacheStore)
    else
      puts "  Cache store: #{Rails.cache.class}"
      puts "  ⚠️  Development uses #{Rails.cache.class} (Redis used in production)"
    end

    # Check Rack::Attack
    puts "\n🛡️  Rack::Attack Configuration:"
    puts "  Enabled: #{Rack::Attack.enabled}"
    puts "  Cache store: #{Rack::Attack.cache.store.class}"

    # Test cache operations
    puts "\n🧪 Testing Cache Operations:"
    begin
      test_key = "redis_health_check_#{Time.now.to_i}"
      test_value = "test_#{SecureRandom.hex(4)}"

      # Test Rails cache
      Rails.cache.write(test_key, test_value, expires_in: 5.seconds)
      cached_value = Rails.cache.read(test_key)

      if cached_value == test_value
        puts "  ✓ Rails cache write/read successful"
      else
        puts "  ✗ Rails cache test failed"
      end

      Rails.cache.delete(test_key)

      # Test direct Redis operations
      redis.set("test:#{test_key}", test_value, ex: 5)
      redis_value = redis.get("test:#{test_key}")

      if redis_value == test_value
        puts "  ✓ Direct Redis write/read successful"
      else
        puts "  ✗ Direct Redis test failed"
      end

      redis.del("test:#{test_key}")

    rescue => e
      puts "  ✗ Cache operation test failed: #{e.message}"
    end

    puts "\n" + "=" * 50
    puts "Health check complete!"
  end

  desc "Monitor Redis performance"
  task monitor: :environment do
    begin
      redis = Redis.new(url: ENV.fetch("REDIS_URL", "redis://localhost:6379/0"))

      puts "\n=== Redis Performance Monitor ==="
      puts "Monitoring for 10 seconds... (Ctrl+C to stop)"
      puts "=" * 50

      10.times do |i|
        info = redis.info
        stats = redis.info("stats")

        puts "\nTime: #{Time.now.strftime('%H:%M:%S')}"
        puts "  Commands processed/sec: #{stats['instantaneous_ops_per_sec']}"
        puts "  Network input: #{stats['instantaneous_input_kbps']} kbps"
        puts "  Network output: #{stats['instantaneous_output_kbps']} kbps"
        puts "  Connected clients: #{info['connected_clients']}"
        puts "  Used memory: #{info['used_memory_human']}"

        sleep 1
      end

    rescue => e
      puts "Monitor failed: #{e.message}"
    end
  end

  desc "Clear Redis cache (use with caution)"
  task clear_cache: :environment do
    print "Are you sure you want to clear the Redis cache? (y/N): "
    response = STDIN.gets.strip

    if response.downcase == "y"
      begin
        Rails.cache.clear
        puts "✓ Rails cache cleared"

        # Clear Sidekiq stats if needed
        require "sidekiq/api"
        Sidekiq::Stats.new.reset
        puts "✓ Sidekiq stats reset"

      rescue => e
        puts "✗ Failed to clear cache: #{e.message}"
      end
    else
      puts "Cancelled"
    end
  end
end
