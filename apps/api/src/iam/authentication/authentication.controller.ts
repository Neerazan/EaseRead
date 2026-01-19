import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { CookieOptions, type Response } from 'express';
import { AuthenticationService } from './authentication.service';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';

@Controller('auth')
export class AuthenticationController {
  constructor(private readonly authService: AuthenticationService) {}

  @Post('sign-up')
  signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }

  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  async signIn(
    @Res({ passthrough: true }) response: Response,
    @Body() signInDto: SignInDto,
  ) {
    const tokens = await this.authService.signIn(signInDto);

    const options: CookieOptions = {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
    };

    response.cookie('access_token', tokens.accessToken, options);
    response.cookie('refresh_token', tokens.refreshToken, options);

    return { ...tokens };
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Body() refreshTokenDto: RefreshTokenDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const tokens = await this.authService.refreshToken(refreshTokenDto);

    const options: CookieOptions = {
      httpOnly: true,
      sameSite: 'lax',
      secure: true,
    };

    response.cookie('access_token', tokens.accessToken, options);
    response.cookie('refresh_token', tokens.refreshToken, options);

    return { ...tokens };
  }
}
