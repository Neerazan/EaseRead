import { registerAs } from '@nestjs/config';

const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
}));

export default redisConfig;
