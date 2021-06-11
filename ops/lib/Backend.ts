import * as ec2 from "@aws-cdk/aws-ec2";
import { InstanceType, SubnetType } from "@aws-cdk/aws-ec2";
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
import * as s3 from "@aws-cdk/aws-s3";
import { exec } from "shelljs";
import { fromRoot } from "./utils";
import { BucketAccessControl } from "@aws-cdk/aws-s3";

export class BackendStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
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
      instanceType: new InstanceType("t2.micro"),
      allocatedStorage: 20,
      storageType: rds.StorageType.STANDARD,
      backupRetention: Duration.days(0),
      engine: DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_13,
      }),
      vpcSubnets: vpc.selectSubnets({
        subnetType: SubnetType.PRIVATE,
      }),
    });

    const publicationsBucket = new s3.Bucket(this, "Publications", {
      bucketName: "cloud-computing-assignment-3-publications",
      accessControl: BucketAccessControl.PUBLIC_READ,
      publicReadAccess: true,
      versioned: false,
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
          ARTICLES_BUCKET: publicationsBucket.bucketName,
        },
        secrets: {
          POSTGRES_SECRET_JSON: ecs.Secret.fromSecretsManager(database.secret!),
        },
        logging: ecs.LogDriver.awsLogs({ streamPrefix: "nodejs-service" }),
      }
    );

    database.secret!.grantRead(taskRole);

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
        subnetType: SubnetType.PRIVATE,
      }),
      securityGroups: [serviceSecurityGroup],
    });

    const albSecurityGroup = new ec2.SecurityGroup(
      this,
      "ServerALBSecurityGroup",
      { vpc }
    );

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
          ARTICLES_BUCKET: publicationsBucket.bucketName,
          POSTGRES_SECRET_ARN: database.secret!.secretName,
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
    database.secret!.grantRead(uploaderLambda);

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
  }
}
