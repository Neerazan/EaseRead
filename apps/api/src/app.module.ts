import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService, ConfigType } from '@nestjs/config';
import { validationSchema } from './config/validation.schema';
import { configs } from './config';
import { TypeOrmModule } from '@nestjs/typeorm';
import databaseConfig from './config/database.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: validationSchema,
      envFilePath: '../../.env',
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
