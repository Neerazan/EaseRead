import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService, ConfigType } from '@nestjs/config';
import { APP_FILTER } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { resolve } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbErrorHandlerRegistry } from './common/database';
import {
  MongoErrorHandler,
  MySQLErrorHandler,
  PostgresErrorHandler,
} from './common/database/error-handlers';
import { AllExceptionsFilter } from './common/filters';
import {
  DatabaseExceptionHandler,
  HttpExceptionHandler,
  IamExceptionHandler,
  UnknownExceptionHandler,
} from './common/filters/handlers';
import { LoggerModule } from './common/logger';
import { configs } from './config';
import databaseConfig from './config/database.config';
import { validationSchema } from './config/validation.schema';
import { DatabaseInitializationService } from './database/database-initialization.service';
import { IamModule } from './iam/iam.module';
import { UserModule } from './user/user.module';
import { RedisModule } from './redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: validationSchema,
      envFilePath: resolve(__dirname, '../../../.env'),
      load: configs,
    }),

    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const db =
          configService.get<ConfigType<typeof databaseConfig>>('database');
        return {
          type: 'postgres',
          host: db?.host,
          port: db?.port,
          username: db?.user,
          password: db?.password,
          database: db?.database,
          autoLoadEntities: db?.autoLoadEntities,
          synchronize: db?.synchronize,
        };
      },
      inject: [ConfigService],
    }),

    IamModule,
    UserModule,
    LoggerModule,
    RedisModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    DatabaseInitializationService,
    PostgresErrorHandler,
    MySQLErrorHandler,
    MongoErrorHandler,
    DbErrorHandlerRegistry,
    HttpExceptionHandler,
    DatabaseExceptionHandler,
    IamExceptionHandler,
    UnknownExceptionHandler,
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
