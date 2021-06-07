import {
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoginRequest, UserDTO } from 'src/models';
import { AppService } from './app.service';
import { AuthService } from './auth/auth.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly authService: AuthService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

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

  @UseGuards(JwtAuthGuard)
  @Get('auth/me')
  async me(@Req() request: Request): Promise<typeof UserDTO.TYPE> {
    return request.user;
  }
}
