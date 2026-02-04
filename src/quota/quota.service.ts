import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

type QuotaCheckResult = [allowed: number, current: number];

@Injectable()
export class QuotaService {
  constructor(private readonly redisService: RedisService) {}

  async checkQuotaNaive(userId: string, limit: number) {
    const key = `quota:naive:${userId}`;

    const current = await this.redisService.redis.get(key);
    const count = current ? Number(current) : 0;

    if (count >= limit) {
      return { allowed: false, current: count };
    }

    await new Promise((r) => setTimeout(r, 50));

    const newCount = await this.redisService.redis.incr(key);

    return { allowed: true, current: newCount };
  }

  async checkQuotaLua(userId: string, limit: number) {
    const luaScript = `
    -- Step 1: Get the current count from Redis
    -- KEYS[1] is the Redis key (e.g., "quota:lua:user123")
    local current = redis.call("GET", KEYS[1])
    
    -- Step 2: Handle the case when key doesn't exist yet
    if not current then
      current = 0  -- If no value exists, start from 0
    else
      current = tonumber(current)  -- Convert string to number
    end

    -- Step 3: Get the limit from arguments
    -- ARGV[1] is the limit passed from Node.js (e.g., 100)
    local limit = tonumber(ARGV[1])

    -- Step 4: Check if we've hit the limit
    if current >= limit then
      return {0, current}  -- Return [0, current_count]
                           -- 0 means "NOT allowed"
    end

    -- Step 5: If we haven't hit the limit, increment the counter
    current = redis.call("INCR", KEYS[1])
    
    -- Step 6: Return success
    return {1, current}  -- Return [1, new_count]
                         -- 1 means "allowed"
  `;

    const result = await this.redisService.redis.eval(
      luaScript,
      1,
      `quota:lua:${userId}`,
      limit,
    );

    if (!Array.isArray(result) || result.length !== 2) {
      throw new Error('Unexpected Redis Lua script result');
    }

    const [allowed, current] = result as QuotaCheckResult;

    return {
      allowed: allowed === 1,
      current,
    };
  }

  async resetQuota(userId: string) {
    await this.redisService.redis.del(`quota:naive:${userId}`);
    await this.redisService.redis.del(`quota:lua:${userId}`);
  }

  async setQuota(userId: string, value: number) {
    await this.redisService.redis.set(`quota:naive:${userId}`, value);
    await this.redisService.redis.set(`quota:lua:${userId}`, value);
  }
}
