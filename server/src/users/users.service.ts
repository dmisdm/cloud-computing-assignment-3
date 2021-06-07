import { Injectable } from '@nestjs/common';
import { User } from 'src/models';

@Injectable()
export class UsersService {
  private readonly users = [
    {
      id: 1,
      name: 'John',
      email: 'john@john.com',
      password: 'changeme',
    },
    {
      id: 2,
      name: 'Maria',
      email: 'maria@test.com',
      password: 'guess',
    },
  ];

  async findOne(email: string): Promise<User | undefined> {
    return this.users.find((user) => user.email === email);
  }
}
