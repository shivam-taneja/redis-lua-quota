import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  public readonly redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: 'localhost',
      port: 6375,
    });
  }

  onModuleInit() {
    this.redis.on('connect', () => {
      console.log('Redis connected successfully');
    });
  }

  onModuleDestroy() {
    this.redis.disconnect();
  }
}
