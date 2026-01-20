import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from 'src/redis/redis.module';
import { User } from 'src/user/entities/user.entity';
import { AuthenticationController } from './authentication/authentication.controller';
import { AuthenticationService } from './authentication/authentication.service';
import { AccessTokenGuard } from './authentication/guards/access-token.guard';
import { AuthGuard } from './authentication/guards/auth.guard';
import { RefreshTokenIdsStorage } from './authentication/refresh-token-ids.storage';
import jwtConfig from './config/jwt.config';
import { BcryptService } from './hashing/bcrypt.service';
import { HashingService } from './hashing/hashing.service';

@Module({
  imports: [
    ConfigModule.forFeature(jwtConfig),
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    RedisModule,
  ],
  providers: [
    AuthenticationService,
    RefreshTokenIdsStorage,
    {
      provide: HashingService,
      useClass: BcryptService,
    },
    AccessTokenGuard,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  controllers: [AuthenticationController],
})
export class IamModule {}
