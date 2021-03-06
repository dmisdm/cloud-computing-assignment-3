import { Injectable } from '@nestjs/common';
import { DatabaseService } from 'src/database/database.service';
import { User } from 'src/models';

@Injectable()
export class UsersService {
  constructor(private databaseService: DatabaseService) {}

  async create(user: Omit<User, 'id'>) {
    if (
      await this.databaseService.prismaClient.user.findUnique({
        where: { email: user.email },
      })
    ) {
      return 'AlreadyExists';
    }
    return this.databaseService.prismaClient.user.create({
      data: {
        ...user,
        roles: ['Basic'],
      },
    });
  }

  async findOne(email: string): Promise<User | null> {
    return this.databaseService.prismaClient.user.findUnique({
      where: {
        email,
      },
    });
  }
}
