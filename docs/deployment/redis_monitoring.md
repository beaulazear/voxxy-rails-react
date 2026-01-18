# Redis Monitoring & Optimization Guide

## Quick Health Check
Run this command to check Redis health:
```bash
bundle exec rails redis:health
```

## Monitor Performance
Watch Redis performance in real-time:
```bash
bundle exec rails redis:monitor
```

## Key Commands for Production

### 1. Check Redis Status on Render
```bash
# SSH into your production server, then:
redis-cli -u $REDIS_URL ping
redis-cli -u $REDIS_URL info server
redis-cli -u $REDIS_URL info memory
redis-cli -u $REDIS_URL info stats
```

### 2. Monitor Sidekiq Jobs
```bash
# View Sidekiq dashboard (add to routes.rb if not already):
# mount Sidekiq::Web => '/sidekiq'

# Or via Rails console:
bundle exec rails c
require 'sidekiq/api'
stats = Sidekiq::Stats.new
puts "Processed: #{stats.processed}"
puts "Failed: #{stats.failed}"
puts "Queued: #{stats.enqueued}"
```

### 3. Check Cache Hit Rates
```bash
redis-cli -u $REDIS_URL info stats | grep keyspace
```

## Performance Optimization Tips

### 1. Enable Redis Persistence (for Render)
- Redis on Render automatically handles persistence
- Data is backed up every 24 hours
- Consider upgrading plan for more frequent backups

### 2. Memory Management
```ruby
# Set max memory policy in production.rb:
config.cache_store = :redis_cache_store, {
  url: ENV.fetch("REDIS_URL"),
  expires_in: 1.hour,  # Set appropriate TTL
  race_condition_ttl: 5.seconds,
  pool_size: 5,
  pool_timeout: 5
}
```

### 3. Monitor Memory Usage
If memory usage is high:
- Review cache expiration times
- Use `redis-cli -u $REDIS_URL --bigkeys` to find large keys
- Clear unused Sidekiq jobs: `Sidekiq::RetrySet.new.clear`

### 4. Connection Pooling
Already configured in your app:
- Sidekiq: Uses connection pool automatically
- Rack::Attack: Uses Redis connection from cache store
- Rails cache: Connection pooling built-in

## Troubleshooting

### Issue: High Memory Usage
```bash
# Find biggest keys
redis-cli -u $REDIS_URL --bigkeys

# Check memory by pattern
redis-cli -u $REDIS_URL memory usage "pattern:*"
```

### Issue: Slow Performance
```bash
# Check slow queries
redis-cli -u $REDIS_URL slowlog get 10

# Monitor commands in real-time
redis-cli -u $REDIS_URL monitor
```

### Issue: Connection Errors
1. Verify REDIS_URL is set: `echo $REDIS_URL`
2. Check network connectivity: `redis-cli -u $REDIS_URL ping`
3. Review connection pool settings in Sidekiq config
4. Check Render service status

## Monitoring Dashboard Setup

### For Production Monitoring:
1. Use Render's built-in metrics for Redis service
2. Set up alerts for:
   - Memory usage > 80%
   - Connection count > 90% of limit
   - CPU usage > 70%

### Key Metrics to Watch:
- **Memory Usage**: Keep below 75% for headroom
- **Hit Rate**: Should be > 80% for effective caching
- **Evicted Keys**: If > 0, increase memory or reduce TTL
- **Connected Clients**: Monitor for connection leaks
- **Commands/sec**: Track for unusual spikes

## Regular Maintenance

### Weekly:
- Check `bundle exec rails redis:health`
- Review Sidekiq dead set size
- Monitor memory trends

### Monthly:
- Analyze slow queries
- Review cache key patterns
- Clean up old Sidekiq jobs

### Before Major Deploys:
- Clear cache if needed: `Rails.cache.clear`
- Ensure Redis has sufficient memory
- Test with `rails redis:health`

## Emergency Commands

```bash
# Flush all data (CAUTION: removes everything)
redis-cli -u $REDIS_URL flushall

# Clear specific pattern
redis-cli -u $REDIS_URL --scan --pattern "cache:*" | xargs redis-cli -u $REDIS_URL del

# Emergency memory cleanup
redis-cli -u $REDIS_URL memory purge
```

## Render-Specific Configuration

Your Redis on Render should have:
- ✅ Automatic persistence
- ✅ Daily backups
- ✅ SSL encryption
- ✅ Private networking

To verify in production:
```bash
bundle exec rails runner "puts Redis.new(url: ENV['REDIS_URL']).ping"
```

## Need Help?
- Check logs: `heroku logs --tail` or Render dashboard
- Run health check: `bundle exec rails redis:health`
- Monitor performance: `bundle exec rails redis:monitor`