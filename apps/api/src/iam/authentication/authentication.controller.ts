import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  UseInterceptors,
} from '@nestjs/common';
import type { Request } from 'express';
import { ActiveUser } from '../decorators/active-user.decorator';
import type { ActiveUserData } from '../interfaces/action-user-data.interface';
import { AuthenticationService } from './authentication.service';
import { REFRESH_TOKEN_COOKIE_NAME } from './constants/auth.constants';
import { Auth } from './decorators/auth.decorator';
import { ClearAuthCookies } from './decorators/clear-auth-cookies.decorator';
import { SetAuthCookies } from './decorators/set-auth-cookies.decorator';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { AuthType } from './enum/auth-type.enum';
import { AuthenticationInterceptor } from './interceptors/authentication.interceptor';

@UseInterceptors(AuthenticationInterceptor)
@Controller('auth')
export class AuthenticationController {
  constructor(private readonly authService: AuthenticationService) {}

  @Post('sign-up')
  @Auth(AuthType.None)
  signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @Post('sign-in')
  @SetAuthCookies()
  @Auth(AuthType.None)
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() signInDto: SignInDto) {
    return this.authService.signIn(signInDto);
  }

  @SetAuthCookies()
  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @Auth(AuthType.None)
  async refreshToken(@Req() request: Request) {
    const refreshToken = request.signedCookies[REFRESH_TOKEN_COOKIE_NAME];

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }
    return this.authService.refreshToken({ refreshToken });
  }

  @Post('sign-out')
  @HttpCode(HttpStatus.OK)
  @Auth(AuthType.Bearer)
  @ClearAuthCookies()
  async signOut(@ActiveUser() user: ActiveUserData) {
    await this.authService.signOut(user.sub);
    return {
      message: 'Sign out successful',
    };
  }
}
