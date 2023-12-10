import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../users/user.service';
import { LoginDto } from '../users/dto/login-users.dto';
import * as bcrypt from 'bcrypt';
import logger from '../core/logger';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userService.findByUsername(username);
    logger.info(`user was found ${user}`);
    if (
      user &&
      user.password &&
      (await bcrypt.compare(password, user.password))
    ) {
      const { password, ...result } = user;
      logger.info(result);
      return result;
    }

    return null;
  }

  async login(loginDto: LoginDto): Promise<{ accessToken: string }> {
    const user = await this.validateUser(loginDto.username, loginDto.password);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const payload = { username: user.username, sub: user.userId };
    return {
      accessToken: this.jwtService.sign(payload),
    };
  }
  async getUserInfoFromToken(token: string): Promise<any> {
    try {
      const decoded = this.jwtService.verify(token);
      logger.info(`${decoded}`);
      const { username } = decoded;
      const user = await this.userService.findByUsername(username);

      if (!user) {
        throw new Error('User not found');
      }
      const { password, ...userInfo } = user;
      return userInfo;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }
}
