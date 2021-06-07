import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { AuthPayload, User } from 'src/models';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOne(email);
    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async signUser(user: User) {
    const payload: typeof AuthPayload.TYPE = {
      email: user.email,
      name: user.name,
      sub: user.id,
    };
    return {
      access_token: this.jwtService.sign(payload),
      payload,
    };
  }
}
