import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import jwtConfig from 'src/iam/config/jwt.config';
import { REQUEST_USER_KEY } from 'src/iam/constants/iam.constants';
import { ACCESS_TOKEN_COOKIE_NAME } from '../constants/auth.constants';

@Injectable()
export class AccessTokenGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,

    @Inject(jwtConfig.KEY)
    private readonly jwtConfiguration: ConfigType<typeof jwtConfig>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromCookie(request);
    const payload = await this.jwtService.verifyAsync(
      token,
      this.jwtConfiguration,
    );
    request[REQUEST_USER_KEY] = payload;
    return true;
  }

  private extractTokenFromCookie(request: Request) {
    const token = request.signedCookies[ACCESS_TOKEN_COOKIE_NAME];
    if (!token) {
      throw new UnauthorizedException('Invalid authentication token!');
    }
    return token;
  }
}
