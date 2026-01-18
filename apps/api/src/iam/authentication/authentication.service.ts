import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { plainToInstance } from 'class-transformer';
import { UserResponseDto } from 'src/user/dto/user-response.dto';
import { User } from 'src/user/entities/user.entity';
import { Repository } from 'typeorm';
import { HashingService } from '../hashing/hashing.service';
import { SignUpDto } from './dto/sign-up.dto';

@Injectable()
export class AuthenticationService {
  constructor(
    private readonly hashingService: HashingService,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async signUp(signUpDto: SignUpDto) {
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
  }
}
