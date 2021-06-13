import * as ec2 from "@aws-cdk/aws-ec2";
import { InstanceType, SecurityGroup, SubnetType, Vpc } from "@aws-cdk/aws-ec2";
import { Repository } from "@aws-cdk/aws-ecr";
import * as ecs from "@aws-cdk/aws-ecs";
import { EcrImage, Secret } from "@aws-cdk/aws-ecs";
import * as elb from "@aws-cdk/aws-elasticloadbalancingv2";
import { ApplicationLoadBalancer } from "@aws-cdk/aws-elasticloadbalancingv2";
import * as iam from "@aws-cdk/aws-iam";
import * as rds from "@aws-cdk/aws-rds";
import { DatabaseInstanceEngine } from "@aws-cdk/aws-rds";
import * as s3 from "@aws-cdk/aws-s3";
import { Bucket, BucketAccessControl } from "@aws-cdk/aws-s3";
import * as cdk from "@aws-cdk/core";
import { Duration, Fn } from "@aws-cdk/core";
import { fromRoot } from "./utils";

export class BackendStack extends cdk.Stack {
  alb: ApplicationLoadBalancer;
  vpc: Vpc;
  serviceSecurityGroup: SecurityGroup;
  publicationsBucket: Bucket;
  analyticsBucket: Bucket;
  databaseSecretName: string;
  constructor(
    scope: cdk.Construct,
    id: string,
    { backendImageTag }: { backendImageTag?: string },
    props?: cdk.StackProps
  ) {
    super(scope, id, props);
    const internalTrafficSubnetName = "internal-traffic";
    const fromInternetSubnetName = "from-internet";

    // The VPC that will contain the ECS service and RDS.
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

    this.vpc = vpc;

    //The cheapest Postgres RDS instance.
    const database = new rds.DatabaseInstance(this, "database", {
      vpc,
      instanceType: new InstanceType("t3.micro"),
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

    // Here we select only a few parts of the database secret to extract it's name.
    // Unfortunately, database.secret.secretName contains an unneeded suffix that causes errors otherwise.
    const secretNameParts = Fn.split("-", database.secret?.secretName!);
    const secretNameWithoutSuffix = Fn.join("-", [
      Fn.select(0, secretNameParts),
      Fn.select(1, secretNameParts),
    ]);
    this.databaseSecretName = secretNameWithoutSuffix;

    // The S3 bucket to support publication uploading
    const publicationsBucket = new s3.Bucket(this, "Publications", {
      bucketName: "cloud-computing-assignment-3-publications",
      accessControl: BucketAccessControl.PUBLIC_READ,
      publicReadAccess: true,
      versioned: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // The S3 bucket to support analytics
    const analyticsBucket = new s3.Bucket(this, "EMRAnalytics", {
      bucketName: "cloud-computing-assignment-3-analytics",
      versioned: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    this.analyticsBucket = analyticsBucket;

    this.publicationsBucket = publicationsBucket;

    const cluster = new ecs.Cluster(this, "BackendCluster", {
      vpc: vpc,
    });

    // The ECS task role. We need the base policy, plus the ability to get the databse secret, and to execute EMR tasks at runtime.
    const taskRole = new iam.Role(this, "NodeJSServerTaskRole", {
      roleName: "NodeJSServerTaskRole",
      assumedBy: new iam.ServicePrincipal("ecs-tasks.amazonaws.com"),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "service-role/AmazonECSTaskExecutionRolePolicy"
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          "AmazonEMRFullAccessPolicy_v2"
        ),
      ],
    });

    taskRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        resources: ["*"],
        actions: ["secretsmanager:GetSecretValue", "elasticmapreduce:*"],
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

    // This construct will build the specified Dockerfile and upload it to ECR automatically.
    const serverImage = EcrImage.fromAsset(fromRoot("."), {
      file: "server/Dockerfile",
    });

    const nodejsServerContainer = nodejsServerTask.addContainer(
      "nodejs-server",
      {
        image: serverImage,
        environment: {
          NODE_ENV: "production",
          PORT: "80",
          ARTICLES_BUCKET: publicationsBucket.bucketName,
          ANALYTICS_BUCKET: analyticsBucket.bucketName,
        },
        secrets: {
          POSTGRES_SECRET_JSON: ecs.Secret.fromSecretsManager(database.secret!),
        },
        logging: ecs.LogDriver.awsLogs({ streamPrefix: "nodejs-service" }),
      }
    );

    // Grant additional permissions so that the buckets and database secret can be read from/written to.
    publicationsBucket.grantReadWrite(taskRole);
    analyticsBucket.grantReadWrite(taskRole);
    database.secret!.grantRead(taskRole);

    nodejsServerContainer.addPortMappings({
      containerPort: 80,
    });

    // The security group attached to the ECS service.
    // We need this so that we can tell the database to allow traffic from it - the Nodejs server.
    const serviceSecurityGroup = new ec2.SecurityGroup(
      this,
      "ServiceSecurityGroup",
      {
        vpc,
        allowAllOutbound: true,
      }
    );

    this.serviceSecurityGroup = serviceSecurityGroup;

    // Allow the nodejs server to communicate with the database.
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

    // Expose the ECS service's load balancer.
    albSecurityGroup.connections.allowFromAnyIpv4(ec2.Port.tcp(80));
    albSecurityGroup.connections.allowFromAnyIpv4(ec2.Port.tcp(443));

    // The ECS target group that tells the load balancer where to direct traffic to, and what nodes it can load balance over.
    // In this case, we only have a single instance, so there is no load balancing, but there is still an ALB that exposes the service.
    const targetGroup = new elb.ApplicationTargetGroup(
      this,
      "ServerTargetGroup",
      {
        vpc,
        port: 80,
        targets: [service],
        deregistrationDelay: Duration.seconds(1),
        healthCheck: {
          path: "/api/health",
          timeout: Duration.seconds(30),
          interval: Duration.seconds(45),
          unhealthyThresholdCount: 3,
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

    // Accept incoming connections from the ALB
    serviceSecurityGroup.connections.allowFrom(alb, ec2.Port.tcp(80));

    this.alb = alb;
  }
}
