import { IsString, IsEmail, Length, IsStrongPassword } from 'class-validator';

export class SignUpDto {
  @IsString()
  @Length(3, 100, {
    message: 'name must be between 3 and 100 characters',
  })
  readonly name: string;

  @IsEmail()
  readonly email: string;

  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 1,
    },
    {
      message:
        'Password must include at least one lowercase letter, one uppercase letter, one number, and one symbol',
    },
  )
  readonly password: string;

  @IsString()
  @Length(3, 20, {
    message: 'Username must be between 3 and 20 characters',
  })
  readonly username: string;
}
