import { Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtConstants } from './constants';
import { AuthPayload, User, UserDTO } from 'src/models';
import { Request } from 'express';

var cookieExtractor = function (req: Request) {
  return req.cookies['access_token'];
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: cookieExtractor,
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  async validate(
    payload: typeof AuthPayload.TYPE,
  ): Promise<typeof UserDTO.TYPE> {
    return {
      email: payload.email,
      id: payload.sub,
      name: payload.name,
    };
  }
}
