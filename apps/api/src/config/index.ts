import appConfig from './app.config';
import databaseConfig from './database.config';
import geminiConfig from './gemini.config';
import redisConfig from './redis.config';
import googleOAuthConfig from '../iam/config/google-oauth.config';

export const configs = [
  appConfig,
  databaseConfig,
  geminiConfig,
  redisConfig,
  googleOAuthConfig,
];
