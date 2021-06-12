import { PrismaClient } from 'prisma-client';
import {
  GetSecretValueCommand,
  SecretsManagerClient,
} from '@aws-sdk/client-secrets-manager';
import { Module } from '@nestjs/common';
import { appConfig } from 'src/config/config';
import { number, string, type } from 'superstruct';
import { prismaClientProviderName } from './constants';
import { DatabaseService } from './database.service';
const Secret = type({
  username: string(),
  password: string(),
  host: string(),
  port: number(),
  dbInstanceIdentifier: string(),
});
@Module({
  providers: [
    {
      provide: prismaClientProviderName,
      useFactory: async () => {
        if (appConfig.postgresSecretArn) {
          const secretsClient = new SecretsManagerClient({});
          const command = new GetSecretValueCommand({
            SecretId: appConfig.postgresSecretArn,
          });
          const response = await secretsClient.send(command);
          const { username, password, host, port, dbInstanceIdentifier } =
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            Secret.create(JSON.parse(response.SecretString!));
          process.env.POSTGRES_URL = `postgresql://${username}:${password}@${host}:${port}/${dbInstanceIdentifier}?schema=public`;
        } else if (appConfig.postgresSecretJson) {
          const { username, password, host, port, dbInstanceIdentifier } =
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            Secret.create(JSON.parse(appConfig.postgresSecretJson));
          process.env.POSTGRES_URL = `postgresql://${username}:${password}@${host}:${port}/${dbInstanceIdentifier}?schema=public`;
        }

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
