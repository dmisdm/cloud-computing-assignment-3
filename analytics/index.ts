import * as emr from "@aws-sdk/client-emr";
import * as s3 from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

const jarContents = fs.readFileSync(
  path.resolve(__dirname, "../mapreducer.jar")
);

export async function run({
  awsRegion,
  bucketName,
  inputObjectKey,
  outputObjectKey,
}: {
  awsRegion: string;
  bucketName: string;
  inputObjectKey: string;
  outputObjectKey: string;
}) {
  const jarName = "mapreducer.jar";
  const s3Client = new s3.S3Client({ region: awsRegion });
  const putCommand = new s3.PutObjectCommand({
    Key: "mapreducer.jar",
    Bucket: bucketName,
    Body: jarContents,
  });
  console.log("Uploading jar..");
  await s3Client.send(putCommand);
  console.log("Successfully uploaded jar");
  console.log("Setting up EMR");

  const emrClient = new emr.EMR({
    region: awsRegion,
  });
  const result = await emrClient.runJobFlow({
    Name: "Test",
    ServiceRole: "EMR_DefaultRole",
    JobFlowRole: "EMR_EC2_DefaultRole",
    ScaleDownBehavior: "TERMINATE_AT_TASK_COMPLETION",
    ReleaseLabel: "emr-5.33.0",
    LogUri: `s3://${bucketName}/logs`,
    Instances: {
      MasterInstanceType: "m4.large",
      Ec2KeyName: "Default",
      InstanceCount: 1,
    },

    Steps: [
      {
        Name: "step",
        ActionOnFailure: "TERMINATE_CLUSTER",

        HadoopJarStep: {
          Jar: `s3://${bucketName}/${jarName}`,
          MainClass: "arxivism.WordCount",
          Args: [
            "arxivism.WordCount",
            `s3://${bucketName}/${inputObjectKey}`,
            `s3://${bucketName}/${outputObjectKey}`,
          ],
        },
      },
    ],
  });
}
