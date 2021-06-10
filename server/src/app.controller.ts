import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoginRequest, RegisterRequest, UserDTO } from 'src/models';
import { AuthService } from './auth/auth.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { UsersService } from './users/users.service';

@Controller()
export class AppController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UsersService,
  ) {}

  @Post('auth/login')
  async login(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const loginRequest = LoginRequest.create(req.body);
    const foundUser = await this.authService.validateUser(
      loginRequest.email,
      loginRequest.password,
    );
    if (!foundUser) {
      throw new UnauthorizedException('Email or password is incorrect');
    }
    const authServiceResponse = await this.authService.signUser(foundUser);
    res.cookie('access_token', authServiceResponse.access_token);
    return authServiceResponse.payload;
  }
  @Post('auth/register')
  async register(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const request = RegisterRequest.create(req.body);
    const createdUserResult = await this.userService.create(request);
    if (createdUserResult === 'AlreadyExists') {
      throw new BadRequestException('A user with that email already exists');
    }
    const authServiceResponse = await this.authService.signUser(
      createdUserResult,
    );
    res.cookie('access_token', authServiceResponse.access_token);
    return authServiceResponse.payload;
  }

  @UseGuards(JwtAuthGuard)
  @Get('auth/me')
  async me(@Req() request: Request): Promise<typeof UserDTO.TYPE> {
    return UserDTO.create(request.user);
  }

  @Get('/removeme')
  async test() {
    return process.env;
  }
}
