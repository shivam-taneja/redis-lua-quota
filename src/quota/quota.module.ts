import { Module } from '@nestjs/common';
import { RedisModule } from '../redis/redis.module';
import { QuotaController } from './quota.controller';
import { QuotaService } from './quota.service';

@Module({
  imports: [RedisModule],
  controllers: [QuotaController],
  providers: [QuotaService],
})
export class QuotaModule {}
