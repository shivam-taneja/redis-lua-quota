import { Controller, Get, Query } from '@nestjs/common';
import { QuotaService } from './quota.service';

@Controller('quota')
export class QuotaController {
  constructor(private readonly quotaService: QuotaService) {}

  @Get('naive')
  naive(@Query('userId') userId: string, @Query('limit') limit: string) {
    return this.quotaService.checkQuotaNaive(userId, Number(limit));
  }

  @Get('lua')
  lua(@Query('userId') userId: string, @Query('limit') limit: string) {
    return this.quotaService.checkQuotaLua(userId, Number(limit));
  }

  // Test endpoint to demonstrate race condition
  @Get('test-race-condition')
  async testRaceCondition(@Query('limit') limit: string) {
    const limitNum = Number(limit) || 100;

    // Reset counters
    await this.quotaService.resetQuota('test-user-naive');
    await this.quotaService.resetQuota('test-user-lua');

    // Dec both limit with 1 (e.g., 99 if limit is 100)
    await this.quotaService.setQuota('test-user-naive', limitNum - 1);
    await this.quotaService.setQuota('test-user-lua', limitNum - 1);

    // Fire 10 concurrent requests for each approach
    const naivePromises = Array(10)
      .fill(null)
      .map(() =>
        this.quotaService.checkQuotaNaive('test-user-naive', limitNum),
      );

    const luaPromises = Array(10)
      .fill(null)
      .map(() => this.quotaService.checkQuotaLua('test-user-lua', limitNum));

    const [naiveResults, luaResults] = await Promise.all([
      Promise.all(naivePromises),
      Promise.all(luaPromises),
    ]);

    const naiveAllowed = naiveResults.filter((r) => r.allowed).length;
    const luaAllowed = luaResults.filter((r) => r.allowed).length;

    return {
      naive: {
        allowed: naiveAllowed,
        shouldHaveAllowed: 1,
        raceConditionOccurred: naiveAllowed > 1,
        results: naiveResults,
      },
      lua: {
        allowed: luaAllowed,
        shouldHaveAllowed: 1,
        raceConditionOccurred: luaAllowed > 1,
        results: luaResults,
      },
    };
  }
}
