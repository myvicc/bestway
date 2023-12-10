import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from '../users/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserController } from '../users/user.controller';

describe('AuthService', () => {
  let authService: AuthService;
  let userService: UserService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        AuthService,
        {
          provide: UserService,
          useValue: {
            findByUsername: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
      ],
      controllers: [UserController],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('validateUser', () => {
    it('should return user if username and password are valid', async () => {
      const mockUser = {
        id: 1,
        createdAt: new Date('2023-12-09T17:51:09.947Z'),
        updatedAt: new Date('2023-12-09T17:53:19.512Z'),
        email: 'test@example.com',
        password: await bcrypt.hash('password', 10),
        firstName: 'John',
        lastName: 'Doe',
        username: 'testuser',
      };
      jest.spyOn(userService, 'findByUsername').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const result = await authService.validateUser('testuser', 'passwor');

      expect(result).toEqual({
        username: 'testuser',
        id: 1,
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        createdAt: new Date('2023-12-09T17:51:09.947Z'),
        updatedAt: new Date('2023-12-09T17:53:19.512Z'),
      });
    });

    it('should return null when password is invalid', async () => {
      const mockUsername = 'testuser';
      const mockPassword = 'testpassword';
      const mockUser = {
        id: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        email: 'test@example.com',
        password: await bcrypt.hash('invalidpassword', 10),
        firstName: 'John',
        lastName: 'Doe',
        username: mockUsername,
      };

      jest.spyOn(userService, 'findByUsername').mockResolvedValueOnce(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValueOnce(false);
      const result = await authService.validateUser(mockUsername, mockPassword);

      expect(result).toBeNull();
    });
  });

  describe('getUserInfoFromToken', () => {
    it('should return user information when token is valid', async () => {
      const mockToken = 'validToken';
      const mockDecodedToken = {
        username: 'testuser',
      };
      const mockUser = {
        id: 1,
        createdAt: new Date('2023-12-09T17:51:09.947Z'),
        updatedAt: new Date('2023-12-09T17:51:09.947Z'),
        email: 'test@example.com',
        password: 'password',
        firstName: 'John',
        lastName: 'Doe',
        username: 'testuser',
      };
      jest.spyOn(jwtService, 'verify').mockReturnValue(mockDecodedToken);
      jest.spyOn(userService, 'findByUsername').mockResolvedValue(mockUser);
      const result = await authService.getUserInfoFromToken(mockToken);
      expect(result).toEqual({
        id: 1,
        createdAt: new Date('2023-12-09T17:51:09.947Z'),
        updatedAt: new Date('2023-12-09T17:51:09.947Z'),
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        username: 'testuser',
        //password: await bcrypt.hash('password', 10),
      });
    });

    it('should throw an error when token is invalid', async () => {
      const mockToken = 'invalidToken';
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid Token');
      });
      await expect(
        authService.getUserInfoFromToken(mockToken),
      ).rejects.toThrowError('Invalid token');
    });
  });
});
