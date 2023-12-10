import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { RedisService } from '../core/redis';

@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],
  providers: [UserService, RedisService],
  controllers: [UserController],
})
export class UserModule {}
