import { SecurityGroup, SubnetType, Vpc } from "@aws-cdk/aws-ec2";
import * as iam from "@aws-cdk/aws-iam";
import * as lambda from "@aws-cdk/aws-lambda";
import * as cdk from "@aws-cdk/core";
import { fromRoot } from "./utils";

export class LambdaFunctionsStack extends cdk.Stack {
  function: lambda.Function;
  constructor(
    scope: cdk.Construct,
    id: string,
    {
      vpc,
      serviceSecurityGroup,
      publicationsBucketName,
      databaseSecretName,
    }: {
      vpc: Vpc;
      serviceSecurityGroup: SecurityGroup;
      publicationsBucketName: string;
      databaseSecretName: string;
    },
    props?: cdk.StackProps
  ) {
    super(scope, id, props);

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
      ],
    });

    const uploaderLambda = new lambda.DockerImageFunction(
      this,
      "UploaderLambda",
      {
        functionName: "BackendLambda",
        vpc,
        vpcSubnets: vpc.selectSubnets({
          subnetType: SubnetType.PRIVATE,
        }),
        role: lambdaRole,
        securityGroups: [serviceSecurityGroup],
        code: lambda.DockerImageCode.fromImageAsset(fromRoot("."), {
          file: "server/lambda.Dockerfile",
        }),
        environment: {
          NODE_ENV: "production",
          ARTICLES_BUCKET: publicationsBucketName,
          POSTGRES_SECRET_ARN: databaseSecretName,
        },
      }
    );

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: ["*"],
        actions: ["secretsmanager:GetSecretValue"],
      })
    );

    this.function = uploaderLambda;
  }
}
