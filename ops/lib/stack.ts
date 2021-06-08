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
import { Duration, StringConcat } from "@aws-cdk/core";

const fromRoot = (...relativeParts: string[]) =>
  path.resolve(process.cwd(), "../", ...relativeParts);

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

    const nodejsServerTask = new ecs.FargateTaskDefinition(
      this,
      "NodeJSServer",
      {
        cpu: 512,
        memoryLimitMiB: 1024,
        taskRole,
      }
    );
    database.secret?.grantRead(taskRole);
    const nodejsServerContainer = nodejsServerTask.addContainer(
      "nodejs-server",
      {
        image: serverImage,
        secrets: {
          POSTGRES_HOST: ecs.Secret.fromSecretsManager(
            database.secret!!,
            "host"
          ),
          POSTGRES_PASSWORD: ecs.Secret.fromSecretsManager(
            database.secret!!,
            "password"
          ),
          POSTGRES_PORT: ecs.Secret.fromSecretsManager(
            database.secret!!,
            "port"
          ),
          POSTGRES_DB: ecs.Secret.fromSecretsManager(
            database.secret!!,
            "dbInstanceIdentifier"
          ),
          POSTGRES_USER: ecs.Secret.fromSecretsManager(
            database.secret!!,
            "username"
          ),
        },
        environment: {
          NODE_ENV: "production",
          PORT: "80",
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

    albSecurityGroup.connections.allowFromAnyIpv4(ec2.Port.tcp(80));
    albSecurityGroup.connections.allowFromAnyIpv4(ec2.Port.tcp(443));

    const targetGroup = new elb.ApplicationTargetGroup(
      this,
      "ServerTargetGroup",
      {
        vpc,
        port: 80,
        targets: [service],
        healthCheck: {
          path: "/api/health",
          timeout: Duration.seconds(30),
          unhealthyThresholdCount: 10,
          interval: Duration.seconds(40),
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
