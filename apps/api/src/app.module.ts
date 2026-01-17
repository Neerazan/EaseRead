import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService, ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { resolve } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { configs } from './config';
import databaseConfig from './config/database.config';
import { validationSchema } from './config/validation.schema';
import { IamModule } from './iam/iam.module';
import { UserModule } from './user/user.module';
import { DatabaseInitializationService } from './database/database-initialization.service';

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
  ],
  controllers: [AppController],
  providers: [AppService, DatabaseInitializationService],
})
export class AppModule {}
