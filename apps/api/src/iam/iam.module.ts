import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RedisModule } from 'src/redis/redis.module';
import { User } from 'src/user/entities/user.entity';
import { AuthenticationController } from './authentication/authentication.controller';
import { AuthenticationService } from './authentication/authentication.service';
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
  controllers: [AuthenticationController],
  providers: [
    AuthenticationService,
    RefreshTokenIdsStorage,
    {
      provide: HashingService,
      useClass: BcryptService,
    },
  ],
})
export class IamModule {}
