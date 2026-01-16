import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { SignUpDto } from './dto/sign-up.dto';
import { AuthenticationService } from './authentication.service';

@Controller('auth')
export class AuthenticationController {
  constructor(private readonly authService: AuthenticationService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  signUp(@Body() signUpDto: SignUpDto) {
    return this.authService.signUp(signUpDto);
  }
}
