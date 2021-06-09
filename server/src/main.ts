import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';
import { config } from 'dotenv';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  config();
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('/api');
  app.use(cookieParser());
  app.enableShutdownHooks();
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.PORT || 8080);
}
bootstrap();
