import { PrismaClient } from '.prisma/client';
import { Module } from '@nestjs/common';
import { prismaClientProviderName } from './constants';

import { DatabaseService } from './database.service';

@Module({
  providers: [
    {
      provide: prismaClientProviderName,
      useFactory: async () => {
        const prisma = new PrismaClient();
        await prisma.$connect();
        return prisma;
      },
    },
    DatabaseService,
  ],
  exports: [DatabaseService],
})
export class DatabaseModule {}
