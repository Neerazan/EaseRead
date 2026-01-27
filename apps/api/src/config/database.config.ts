import { registerAs } from '@nestjs/config';

const databaseConfig = registerAs('database', () => ({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT!, 10) || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false,
  autoLoadEntities: true,
  migrationsRun: true,
}));

export default databaseConfig;
