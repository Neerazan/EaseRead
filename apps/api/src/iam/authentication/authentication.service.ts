import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { HashingService } from '../hashing/hashing.service';
import { SignUpDto } from './dto/sign-up.dto';
import { plainToInstance } from 'class-transformer';
import { UserResponseDto } from 'src/user/dto/user-response.dto';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly hashingService: HashingService,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async signUp(signUpDto: SignUpDto) {
    try {
      const { email, name, password, username } = signUpDto;
      const hashedPassword = await this.hashingService.hash(password);
      const user = this.userRepository.create({
        name,
        username,
        email,
        passwordHash: hashedPassword,
      });
      const createdUser = await this.userRepository.save(user);
      return plainToInstance(UserResponseDto, createdUser, {
        excludeExtraneousValues: true,
      });
    } catch (error) {
      const PG_UNIQUE_VIOLATION = '23505';
      if (error.code === PG_UNIQUE_VIOLATION) {
        throw new ConflictException('User with email already exist.');
      }
      throw error;
    }
  }
}
