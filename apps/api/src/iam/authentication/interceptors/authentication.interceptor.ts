import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';

import { Reflector } from '@nestjs/core';
import { CookieOptions, Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import appConfig from '../../../config/app.config';
import {
  ACCESS_TOKEN_COOKIE_NAME,
  REFRESH_TOKEN_COOKIE_NAME,
} from '../constants/auth.constants';
import { SET_AUTH_COOKIES_KEY } from '../decorators/set-auth-cookies.decorator';

interface AuthenticationResponse {
  accessToken: string;
  refreshToken: string;
  [key: string]: any;
}

@Injectable()
export class AuthenticationInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    @Inject(appConfig.KEY)
    private readonly appConfiguration: ConfigType<typeof appConfig>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const setAuthCookies = this.reflector.getAllAndOverride<boolean>(
      SET_AUTH_COOKIES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!setAuthCookies) {
      return next.handle();
    }

    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data: AuthenticationResponse) => {
        if (!data?.accessToken || !data?.refreshToken) {
          return data;
        }

        const { accessToken, refreshToken, ...rest } = data;

        const options: CookieOptions = {
          httpOnly: true,
          sameSite: 'lax',
          secure: this.appConfiguration.env === 'production',
          path: '/',
          signed: true,
        };

        response.cookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, options);
        response.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, options);

        return {
          ...rest,
        };
      }),
    );
  }
}
