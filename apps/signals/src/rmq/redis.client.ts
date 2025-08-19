import { createClient, RedisClientType } from 'redis';
import { ConfigService } from '@nestjs/config';

let client: RedisClientType;

export async function redisClient(configService: ConfigService) {
  if (!client) {
    const redisUri = configService.get<string>('REDIS_URI');
    client = createClient({ url: redisUri });
    await client.connect();
  }
  return client;
}
