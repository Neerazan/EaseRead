import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { AuthenticationController } from './authentication/authentication.controller';
import { AuthenticationService } from './authentication/authentication.service';
import jwtConfig from './config/jwt.config';
import { BcryptService } from './hashing/bcrypt.service';
import { HashingService } from './hashing/hashing.service';

@Module({
  imports: [
    ConfigModule.forFeature(jwtConfig),
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [AuthenticationController],
  providers: [
    AuthenticationService,
    {
      provide: HashingService,
      useClass: BcryptService,
    },
  ],
})
export class IamModule {}
