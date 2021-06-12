import { PrismaClient } from 'prisma-client';
import { Inject, Injectable } from '@nestjs/common';
import { prismaClientProviderName } from './constants';

@Injectable()
export class DatabaseService {
  constructor(
    @Inject(prismaClientProviderName)
    public readonly prismaClient: PrismaClient,
  ) {}
}
