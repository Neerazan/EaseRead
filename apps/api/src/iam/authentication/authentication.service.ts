import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
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
    try {
      const { email, fullName, password, username } = signUpDto;
      const hashedPassword = await this.hashingService.hash(password);
      const user = this.userRepository.create({
        fullName,
        username,
        email,
        passwordHash: hashedPassword,
      });
      return this.userRepository.save(user);
    } catch (error) {
      const pgUniqueVioletionKey = '23505';
      if (error.code === pgUniqueVioletionKey) {
        throw new ConflictException('User with email already exist.');
      }
    }
  }
}
