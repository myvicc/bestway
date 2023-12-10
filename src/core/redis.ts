import { Injectable } from '@nestjs/common';
import * as IORedis from 'ioredis';
import * as process from 'process';

@Injectable()
export class RedisService {
  private readonly redisClient: IORedis.Redis;

  constructor() {
    this.redisClient = new (IORedis as any)({
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
    });
  }

  getClient(): IORedis.Redis {
    return this.redisClient;
  }
}

export { IORedis };
