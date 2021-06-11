import * as elasticbeanstalk from "@aws-cdk/aws-elasticbeanstalk";
import * as iam from "@aws-cdk/aws-iam";
import * as s3assets from "@aws-cdk/aws-s3-assets";
import * as cdk from "@aws-cdk/core";
import { exec } from "shelljs";
import { fromRoot } from "./utils";
export class FrontendStack extends cdk.Stack {
  constructor(
    scope: cdk.Construct,
    id: string,
    dependencies: { backendUrl: string },
    props?: cdk.StackProps
  ) {
    super(scope, id, props);

    exec("./bundle.sh", {
      cwd: fromRoot("."),
    });

    const frontend = new elasticbeanstalk.CfnApplication(this, "Frontend", {
      applicationName: "Frontend",
    });

    const frontendAssets = new s3assets.Asset(this, "FrontendAssets", {
      path: fromRoot("bundle.zip"),
    });

    const platform = this.node.tryGetContext("platform");

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
    const frontendRole = new iam.Role(this, `FrontendRole`, {
      assumedBy: new iam.ServicePrincipal("ec2.amazonaws.com"),
    });

    frontendRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName("AWSElasticBeanstalkWebTier")
    );

    const profileName = `FrontendEBProfile`;
    const instanceProfile = new iam.CfnInstanceProfile(this, profileName, {
      instanceProfileName: profileName,
      roles: [frontendRole.roleName],
    });
    latestFrontendVersion.addDependsOn(frontend);
    const frontendEnvironment = new elasticbeanstalk.CfnEnvironment(
      this,
      "FrontendEnvironment",
      {
        applicationName: "Frontend",
        platformArn: platform,
        versionLabel: latestFrontendVersion.ref,
        solutionStackName: "64bit Amazon Linux 2 v5.4.0 running Node.js 14",
        environmentName: "Frontend",
        optionSettings: [
          {
            namespace: "aws:autoscaling:launchconfiguration",
            optionName: "IamInstanceProfile",
            value: profileName,
          },
          {
            namespace: "aws:autoscaling:launchconfiguration",
            optionName: "InstanceType",
            value: "t3.small",
          },

          {
            namespace: "aws:elasticbeanstalk:application:environment",
            optionName: "BACKEND_URL",
            value: dependencies.backendUrl,
          },
        ],
      }
    );
    frontendEnvironment.addDependsOn(latestFrontendVersion);

    frontendEnvironment.addDependsOn(frontend);
  }
}
