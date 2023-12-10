import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-users.dto';
import * as bcrypt from 'bcrypt';
import { RedisService } from '../core/redis';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    private readonly redisService: RedisService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    const { password, ...userDtoWithoutPassword } = createUserDto;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({
      ...userDtoWithoutPassword,
      password: hashedPassword,
    });
    const savedUser = await this.userRepository.save(user);
    await this.redisService
      .getClient()
      .set(`user:${savedUser.username}`, JSON.stringify(savedUser));

    return savedUser;
  }

  async findByUsername(username: string): Promise<UserEntity | null> {
    const userData = await this.redisService
      .getClient()
      .get(`user:${username}`);

    if (userData) {
      const user: UserEntity = JSON.parse(userData);
      return user;
    }
    const userFromDb = await this.userRepository.findOne({
      where: { username },
    });

    if (userFromDb) {
      await this.redisService
        .getClient()
        .set(`user:${username}`, JSON.stringify(userFromDb));
    }
    return userFromDb;
  }
  getRedisService() {
    return this.redisService;
  }
}
