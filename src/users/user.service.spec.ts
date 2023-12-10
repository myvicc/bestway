import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { RedisService } from '../core/redis';

jest.mock('bcrypt');

describe('UserService', () => {
  let service: UserService;
  let userRepository: Repository<UserEntity>;
  const mockRedisService = {
    getClient: jest.fn(() => ({
      set: jest.fn(),
      get: jest.fn(),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(UserEntity),
          useClass: Repository,
        },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    userRepository = module.get<Repository<UserEntity>>(
      getRepositoryToken(UserEntity),
    );
  });

  it('should create a user', async () => {
    const createUserDto = {
      username: 'testuser',
      email: 'test@gmail.com',
      password: 'testpassword',
    };

    const userEntity = new UserEntity();
    userEntity.username = createUserDto.username;
    userEntity.password = 'hashedPassword';
    userEntity.email = createUserDto.email;

    jest.spyOn(userRepository, 'create').mockReturnValue(userEntity);
    jest.spyOn(userRepository, 'save').mockResolvedValue(userEntity);
    jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword');

    const result = await service.create(createUserDto);

    expect(userRepository.create).toHaveBeenCalledWith({
      username: 'testuser',
      password: 'hashedPassword',
      email: 'test@gmail.com',
    });
    expect(userRepository.save).toHaveBeenCalledWith(userEntity);
    expect(bcrypt.hash).toHaveBeenCalledWith('testpassword', 10);
    expect(result).toEqual(userEntity);
  });

  it('should find user by username from Redis cache', async () => {
    const username = 'testuser';
    const userData = '{"id": 1, "username": "testuser"}';

    const userEntity = new UserEntity();
    userEntity.id = 1;
    userEntity.username = 'testuser';

    // Mocking the findOne method to resolve with userEntity
    jest.spyOn(userRepository, 'findOne').mockResolvedValue(userEntity);

    // Mocking the Redis get method to resolve with userData
    mockRedisService.getClient().get.mockResolvedValue(userData);

    const result = await service.findByUsername(username);

    // Verify that findOne was called with the correct parameters
    expect(userRepository.findOne).toHaveBeenCalledWith({
      where: { username },
    });

    // Verify that the Redis getClient().get was called with the correct key
    expect(mockRedisService.getClient().get).toHaveBeenCalledWith(
      `user:${username}`,
    );

    // Verify that the method returned the expected result
    expect(result).toEqual(JSON.parse(userData));
  });

  // it('should find user by username from the database and cache the result', async () => {
  //   const username = 'testuser';
  //   const userEntity = new UserEntity();
  //   userEntity.id = 1;
  //   userEntity.username = 'testuser';
  //
  //   jest.spyOn(service.redisService.getClient(), 'get').mockResolvedValue(null);
  //   jest.spyOn(userRepository, 'findOne').mockResolvedValueOnce(userEntity);
  //   const result = await service.findByUsername(username);
  //
  //   expect(service.redisService.getClient().get).toHaveBeenCalledWith(
  //     `user:${username}`,
  //   );
  //   expect(userRepository.findOne).toHaveBeenCalledWith({
  //     where: { username: 'testuser' },
  //   });
  //   expect(service.redisService.getClient().set).toHaveBeenCalledWith(
  //     `user:${username}`,
  //     JSON.stringify(userEntity),
  //   );
  //   expect(result).toEqual(userEntity);
  // });
});
