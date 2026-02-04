import { Module } from '@nestjs/common';
import { QuotaModule } from './quota/quota.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [RedisModule, QuotaModule],
})
export class AppModule {}
