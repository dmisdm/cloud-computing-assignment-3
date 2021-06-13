import { SecurityGroup, SubnetType, Vpc } from "@aws-cdk/aws-ec2";
import * as iam from "@aws-cdk/aws-iam";
import * as lambda from "@aws-cdk/aws-lambda";
import { Bucket } from "@aws-cdk/aws-s3";
import * as cdk from "@aws-cdk/core";
import { Duration } from "@aws-cdk/core";
import { fromRoot } from "./utils";

export class LambdaFunctionsStack extends cdk.Stack {
  function: lambda.Function;
  constructor(
    scope: cdk.Construct,
    id: string,
    // Here we accept dependencies:
    // The backend VPC
    // The backend service security group (we also use this for the lambda so that it has the same access within the VPC)
    // Publications and analytics bucket.
    // Database secret
    {
      vpc,
      serviceSecurityGroup,
      publicationsBucket,
      analyticsBucket,
      databaseSecretName,
    }: {
      vpc: Vpc;
      serviceSecurityGroup: SecurityGroup;
      publicationsBucket: Bucket;
      analyticsBucket: Bucket;
      databaseSecretName: string;
    },
    props?: cdk.StackProps
  ) {
    super(scope, id, props);

    // This lambda requires the same permissions as the ECS service
    // Base execution role, EMR, database, and S3 bucket access
    const lambdaRole = new iam.Role(this, "UploaderLambdaRole", {
      roleName: "UploaderLambdaRole",
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaVPCAccessExecutionRole"
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "AmazonEMRFullAccessPolicy_v2"
        ),
      ],
    });

    // Give the lambda access to EMR and secrets manager (for the database secret)
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: ["*"],
        actions: ["secretsmanager:GetSecretValue", "elasticmapreduce:*"],
      })
    );

    analyticsBucket.grantReadWrite(lambdaRole);
    publicationsBucket.grantReadWrite(lambdaRole);

    // We are deploying a Docker container Lambda function.
    // This construct builds a Dockerfile and uploads it to ECR automatically.
    const lambdaCode = lambda.DockerImageCode.fromImageAsset(fromRoot("."), {
      file: "server/lambda.Dockerfile",
    });

    // The main lambda definition which connects the other constructs.
    const uploaderLambda = new lambda.DockerImageFunction(
      this,
      "UploaderLambda",
      {
        functionName: "BackendLambda",
        memorySize: 512,
        vpc,
        vpcSubnets: vpc.selectSubnets({
          subnetType: SubnetType.PRIVATE,
        }),
        role: lambdaRole,
        securityGroups: [serviceSecurityGroup],
        code: lambdaCode,
        environment: {
          NODE_ENV: "production",
          ARTICLES_BUCKET: publicationsBucket.bucketName,
          POSTGRES_SECRET_ARN: databaseSecretName,
          ANALYTICS_BUCKET: analyticsBucket.bucketName,
        },
        timeout: Duration.seconds(15),
      }
    );

    this.function = uploaderLambda;
  }
}
