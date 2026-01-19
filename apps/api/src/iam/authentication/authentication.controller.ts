import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { SignUpDto } from './dto/sign-up.dto';
import { AuthenticationService } from './authentication.service';
import { SignInDto } from './dto/sign-in.dto';
import { CookieOptions, type Response } from 'express';

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
}
