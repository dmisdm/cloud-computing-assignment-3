import { run } from "index";
import yargs from "yargs";

const argv = yargs
  .options({
    awsRegion: {
      type: "string",
      demandOption: true,
    },
    bucketName: {
      type: "string",
      default: "arxivism-emr",
    },
    inputObjectKey: {
      type: "string",
      default: "input",
    },
    outputObjectKey: {
      type: "string",
      default: "output",
    },
    postgresSecretArn: {
      type: "string",
      demandOption: true,
    },
  })
  .env()
  .parseSync();

run(argv);
