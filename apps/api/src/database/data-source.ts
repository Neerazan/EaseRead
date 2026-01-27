import { config } from 'dotenv';
import { join, resolve } from 'path';
import 'tsconfig-paths/register';
import { DataSource, DataSourceOptions } from 'typeorm';

// Load .env from the monorepo root
config({ path: resolve(__dirname, '../../../../.env') });

const options: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT!, 10) || 5432,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [join(__dirname, '../**/*.entity.{ts,js}')],
  migrations: [join(__dirname, './migrations/*.{ts,js}')],
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
};

export const AppDataSource = new DataSource(options);
