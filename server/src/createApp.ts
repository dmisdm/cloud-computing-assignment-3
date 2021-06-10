import { config } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
export async function createApp(expressApp: Express.Application) {
  config();
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressApp),
  );
  app.setGlobalPrefix('/api');
  app.use(cookieParser());
  app.enableShutdownHooks();
  app.useGlobalPipes(new ValidationPipe());
  return app;
}
