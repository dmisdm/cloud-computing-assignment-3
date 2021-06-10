import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';
import { AuthPayload, UserDTO } from 'src/models';
import { jwtConstants } from './constants';

const cookieExtractor = function (req: Request) {
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
