import { Injectable } from '@nestjs/common';
import * as IORedis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly redisClient: IORedis.Redis;

  constructor() {
    this.redisClient = new (IORedis as any)({
      host: 'localhost',
      port: 6379,
    });
  }

  getClient(): IORedis.Redis {
    return this.redisClient;
  }
}

export { IORedis };
