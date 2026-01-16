import { IsEmail, IsString } from 'class-validator';

export class SignInDto {
  @IsString()
  @IsEmail()
  readonly email: string;

  @IsString()
  readonly password: string;
}
