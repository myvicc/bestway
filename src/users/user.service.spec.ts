import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { RedisService } from '../core/redis';

jest.mock('bcrypt');
describe('UserService', () => {
  let userService: UserService;
  let userRepository: Repository<UserEntity>;
  let redisService: RedisService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(UserEntity),
          useClass: Repository,
        },
        RedisService, // Add the RedisService to the providers
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
    userRepository = module.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
    redisService = module.get<RedisService>(RedisService);
  });

  describe('create', () => {
    it('should create a user and save it to the repository and Redis', async () => {
      // Arrange
      const createUserDto = {
        username: 'testuser',
        email: 'test@gmail.com',
        password: 'testpassword',
      };

      const hashedPassword = 'hashedPassword';
      const savedUser = new UserEntity();
      savedUser.id = 1;
      savedUser.username = createUserDto.username;
      savedUser.email = createUserDto.email;
      savedUser.password = hashedPassword;

      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedPassword);
      jest.spyOn(userRepository, 'create').mockReturnValue(savedUser);
      jest.spyOn(userRepository, 'save').mockResolvedValue(savedUser);
      jest.spyOn(redisService.getClient(), 'set').mockResolvedValue(null);

      // Act
      const result = await userService.create(createUserDto);

      // Assert
      expect(bcrypt.hash).toHaveBeenCalledWith('testpassword', 10);
      expect(userRepository.create).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@gmail.com',
        password: hashedPassword,
      });
      expect(userRepository.save).toHaveBeenCalledWith(savedUser);
      expect(redisService.getClient().set).toHaveBeenCalledWith(
        `user:${savedUser.username}`,
        JSON.stringify(savedUser),
      );
      expect(result).toEqual(savedUser);
    });
  });

  describe('findByUsername', () => {
    it('should find user by username from Redis cache', async () => {
      // Arrange
      const username = 'testuser';
      const userData = '{"id": 1, "username": "testuser"}';

      jest.spyOn(redisService.getClient(), 'get').mockResolvedValue(userData);

      // Act
      const result = await userService.findByUsername(username);

      // Assert
      expect(redisService.getClient().get).toHaveBeenCalledWith(
        `user:${username}`,
      );
      expect(result).toEqual(JSON.parse(userData));
    });

    it('should find user by username from the repository and save to Redis if not in cache', async () => {
      // Arrange
      const username = 'testuser';
      const userFromDb = new UserEntity();
      userFromDb.id = 1;
      userFromDb.username = 'testuser';

      jest.spyOn(redisService.getClient(), 'get').mockResolvedValue(null);
      jest.spyOn(userRepository, 'findOne').mockResolvedValue(userFromDb);
      jest.spyOn(redisService.getClient(), 'set').mockResolvedValue(null);

      // Act
      const result = await userService.findByUsername(username);

      // Assert
      expect(redisService.getClient().get).toHaveBeenCalledWith(
        `user:${username}`,
      );
      expect(userRepository.findOne).toHaveBeenCalledWith({
        where: { username },
      });
      expect(redisService.getClient().set).toHaveBeenCalledWith(
        `user:${username}`,
        JSON.stringify(userFromDb),
      );
      expect(result).toEqual(userFromDb);
    });
  });
});
