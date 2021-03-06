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

    // The main EB application which other resources are added to.
    const frontend = new elasticbeanstalk.CfnApplication(this, "Frontend", {
      applicationName: "Frontend",
    });

    // This construct allows us to automatically upload a zip file of our code, and reference it in subsequent constructs.
    const frontendAssets = new s3assets.Asset(this, "FrontendAssets", {
      path: fromRoot("bundle.zip"),
    });

    const platform = this.node.tryGetContext("platform");

    // The description of where to find code assets (in this case, it is a zip file on S3)
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

    // The IAM execution role. No special permissions are required for this role, as it isn't accessing any other private resources.
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

    // The EB environment which explains how to construct EC2 instances and run our application.
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

    latestFrontendVersion.addDependsOn(frontend);

    frontendEnvironment.addDependsOn(latestFrontendVersion);

    frontendEnvironment.addDependsOn(frontend);
  }
}
