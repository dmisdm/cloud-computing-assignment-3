import { Module } from '@nestjs/common';
import { Config } from './config';

@Module({
  providers: [Config],
  exports: [Config],
})
export class ConfigModule {}
