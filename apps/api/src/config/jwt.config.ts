import { registerAs } from '@nestjs/config';

const jwtConfig = registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET,
  audience: process.env.JWT_TOKEN_AUDIENCE,
  issuer: process.env.JWT_TOKEN_ISSUER,
  access_token_ttl: parseInt(process.env.JWT_ACCESS_TOKEN_TTL!, 10) || 3600,
  refresh_token_ttl: parseInt(process.env.JWT_REFRESH_TOKEN_TTL!, 10) || 86400,
}));

export default jwtConfig;
