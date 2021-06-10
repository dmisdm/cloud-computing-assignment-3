import * as ec2 from "@aws-cdk/aws-ec2";
import { SubnetType } from "@aws-cdk/aws-ec2";
import * as ecs from "@aws-cdk/aws-ecs";
import { EcrImage } from "@aws-cdk/aws-ecs";
import * as elb from "@aws-cdk/aws-elasticloadbalancingv2";
import * as rds from "@aws-cdk/aws-rds";
import { DatabaseInstanceEngine } from "@aws-cdk/aws-rds";
import * as cdk from "@aws-cdk/core";
import * as path from "path";
import * as iam from "@aws-cdk/aws-iam";
import { DockerImage, Duration } from "@aws-cdk/core";
import * as lambda from "@aws-cdk/aws-lambda";
import * as apigateway from "@aws-cdk/aws-apigateway";
import * as elasticbeanstalk from "@aws-cdk/aws-elasticbeanstalk";
import * as s3assets from "@aws-cdk/aws-s3-assets";
import { exec } from "shelljs";
const fromRoot = (...relativeParts: string[]) =>
  path.resolve(process.cwd(), "../", ...relativeParts);

export class BackendStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    exec("./bundle.sh", {
      cwd: fromRoot("."),
    });
    const internalTrafficSubnetName = "internal-traffic";
    const fromInternetSubnetName = "from-internet";
    const vpc = new ec2.Vpc(this, "MainVPC", {
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: fromInternetSubnetName,
          subnetType: SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: internalTrafficSubnetName,
          subnetType: SubnetType.PRIVATE,
        },
      ],
    });

    const database = new rds.DatabaseInstance(this, "database", {
      vpc,
      engine: DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_13,
      }),
      vpcSubnets: vpc.selectSubnets({
        subnetType: SubnetType.PRIVATE,
      }),
    });

    const cluster = new ecs.Cluster(this, "BackendCluster", {
      vpc: vpc,
    });

    const serverImage = EcrImage.fromAsset(fromRoot("."), {
      file: "server/Dockerfile",
    });

    const taskRole = new iam.Role(this, "NodeJSServerTaskRole", {
      roleName: "NodeJSServerTaskRole",
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AmazonECSTaskExecutionRolePolicy"
        ),
      ],
    });

    taskRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: ["*"],
        actions: ["secretsmanager:GetSecretValue"],
      })
    );

    const nodejsServerTask = new ecs.FargateTaskDefinition(
      this,
      "NodeJSServer",
      {
        cpu: 512,
        memoryLimitMiB: 1024,
        taskRole,
      }
    );
    const nodejsServerContainer = nodejsServerTask.addContainer(
      "nodejs-server",
      {
        image: serverImage,
        environment: {
          NODE_ENV: "production",
          PORT: "80",
        },
        secrets: {
          POSTGRES_SECRET_JSON: ecs.Secret.fromSecretsManager(
            database.secret!!
          ),
        },
        logging: ecs.LogDriver.awsLogs({ streamPrefix: "nodejs-service" }),
      }
    );

    nodejsServerContainer.addPortMappings({
      containerPort: 80,
    });

    const serviceSecurityGroup = new ec2.SecurityGroup(
      this,
      "ServiceSecurityGroup",
      {
        vpc,
        allowAllOutbound: true,
      }
    );

    database.connections.allowFrom(serviceSecurityGroup, ec2.Port.tcp(5432));

    const service = new ecs.FargateService(this, "BackendService", {
      taskDefinition: nodejsServerTask,
      cluster,
      vpcSubnets: vpc.selectSubnets({
        subnets: [vpc.publicSubnets[0], vpc.privateSubnets[0]],
      }),
      securityGroups: [serviceSecurityGroup],
    });

    const albSecurityGroup = new ec2.SecurityGroup(
      this,
      "ServerALBSecurityGroup",
      { vpc }
    );

    const { username, password, host, port, dbInstanceIdentifier } =
      database.secret!!.secretValue.toJSON();

    albSecurityGroup.connections.allowFromAnyIpv4(ec2.Port.tcp(80));
    albSecurityGroup.connections.allowFromAnyIpv4(ec2.Port.tcp(443));

    const lambdaRole = new iam.Role(this, "UploaderLambdaRole", {
      roleName: "UploaderLambdaRole",
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AWSLambdaBasicExecutionRole"
        ),
      ],
    });
    /*     const uploaderLambda = new lambda.Function(this, "UploaderLambda", {
      role: lambdaRole,
      runtime: lambda.Runtime.NODEJS_14_X,
      code: new lambda.AssetCode(fromRoot(".")),
      handler: "server/dist/lambda.handler",
      securityGroups: [serviceSecurityGroup],
    }); */
    const uploaderLambda = new lambda.DockerImageFunction(
      this,
      "UploaderLambda",
      {
        role: lambdaRole,
        securityGroups: [serviceSecurityGroup],
        code: lambda.DockerImageCode.fromImageAsset(fromRoot("."), {
          file: "server/lambda.Dockerfile",
        }),
      }
    );

    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: ["*"],
        actions: ["secretsmanager:GetSecretValue"],
      })
    );

    const lambdaEndpoint = new apigateway.LambdaRestApi(
      this,
      "UploaderLambdaRestApi",
      { handler: uploaderLambda }
    );

    const targetGroup = new elb.ApplicationTargetGroup(
      this,
      "ServerTargetGroup",
      {
        vpc,
        port: 80,
        targets: [service],
        healthCheck: {
          path: "/api/health",
          timeout: Duration.seconds(15),
          unhealthyThresholdCount: 5,
          interval: Duration.seconds(16),
        },
      }
    );
    const alb = new elb.ApplicationLoadBalancer(this, "BackendALB", {
      vpc,
      securityGroup: albSecurityGroup,
      internetFacing: true,
      vpcSubnets: vpc.selectSubnets({
        subnetType: SubnetType.PUBLIC,
      }),
    });

    const listener = new elb.ApplicationListener(this, "ServerListener", {
      loadBalancer: alb,
      open: true,
      port: 80,
    });
    listener.addTargetGroups("ServerTargetGroups", {
      targetGroups: [targetGroup],
    });

    serviceSecurityGroup.connections.allowFrom(alb, ec2.Port.tcp(80));

    const frontend = new elasticbeanstalk.CfnApplication(this, "Frontend", {
      applicationName: "Frontend",
    });

    const frontendAssets = new s3assets.Asset(this, "FrontendAssets", {
      path: fromRoot("bundle.zip"),
    });

    const latestFrontendVersion = new elasticbeanstalk.CfnApplicationVersion(
      this,
      "LatestFrontendVersion",
      {
        applicationName: "Frontend",
        sourceBundle: {
          s3Bucket: frontendAssets.s3BucketName,
          s3Key: frontendAssets.s3ObjectKey,
        },
      }
    );
    latestFrontendVersion.addDependsOn(frontend);

    const frontendEnvironment = new elasticbeanstalk.CfnEnvironment(
      this,
      "FrontendEnvironment",
      {
        applicationName: "Frontend",
        platformArn:
          "arn:aws:elasticbeanstalk:ap-southeast-2::platform/Node.js 12 running on 64bit Amazon Linux 2/5.0.2",
        versionLabel: latestFrontendVersion.ref,
        optionSettings: [
          {
            namespace: "aws:elasticbeanstalk:application:environment",
            optionName: "BACKEND_URL",
            value: "http://" + alb.loadBalancerDnsName,
          },
        ],
      }
    );
    frontendEnvironment.addDependsOn(latestFrontendVersion);

    frontendEnvironment.addDependsOn(frontend);
  }
}
