import yargs from 'yargs';
import { config } from 'dotenv';
config();
export const appConfig = yargs
  .option('postgresUrl', {
    type: 'string',
  })
  .option('articlesBucket', {
    type: 'string',
    demandOption: true,
  })
  .option('awsRegion', {
    type: 'string',
    demandOption: true,
  })
  .option('postgresSecretArn', {
    type: 'string',

    description:
      'The secret arn that refers to postgres connection and secret details',
  })
  .option('postgresSecretJson', {
    type: 'string',
    description: 'Postgres secret json ',
  })
  .option('nodeEnv', {
    type: 'string',
    default: 'development',
  })
  .check((argv) => {
    if (
      !argv.postgresSecretArn &&
      !argv.postgresUrl &&
      !argv.postgresSecretJson
    ) {
      throw Error(
        'Either postgresSecretArn, postgresUrl, or postgresSecretJson is required',
      );
    }
    return true;
  })
  .env()
  .parseSync();
