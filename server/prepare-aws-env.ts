#!/usr/bin/env yarn ts-node
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';
import path from 'path';
import fs from 'fs';
import yargs from 'yargs';
import { number, string, type } from 'superstruct';

const Secret = type({
  username: string(),
  password: string(),
  host: string(),
  port: number(),
  dbInstanceIdentifier: string(),
});
const argv = yargs
  .option('postgresSecretArn', {
    type: 'string',
    demandOption: true,
    description:
      'The secret arn that refers to postgres connection and secret details',
  })
  .env()
  .parseSync();

async function run() {
  const { postgresSecretArn } = argv;
  const secretsClient = new SecretsManagerClient({});
  const command = new GetSecretValueCommand({ SecretId: postgresSecretArn });
  const response = await secretsClient.send(command);
  const { username, password, host, port, dbInstanceIdentifier } =
    Secret.create(JSON.parse(response.SecretString!!));
  const dotenvFileString = `
POSTGRES_URL="postgresql://${username}:${password}@${host}:${port}/${dbInstanceIdentifier}"
  `;
  const outputPath = path.resolve(__dirname, '.env');
  fs.writeFileSync(outputPath, dotenvFileString);
  console.log('Wrote .env file to ' + outputPath);
}

run();
