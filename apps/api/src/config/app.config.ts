import { registerAs } from '@nestjs/config';

const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT!, 10) || 3000,
  env: process.env.NODE_ENV || 'development',
  name: 'easeread-api',
}));

export default appConfig;
