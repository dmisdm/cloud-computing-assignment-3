#!/usr/bin/env node
import * as cdk from "@aws-cdk/core";
import "source-map-support/register";
import { BackendStack } from "../lib/Backend";
import { FrontendStack } from "../lib/Frontend";
import { LambdaFunctionsStack } from "../lib/LambdaFunctions";
import * as yargs from "yargs";

const { backendImageTag } = yargs
  .options({
    backendImageTag: {
      type: "string",
      description: "Pass in a predefined ecr image tag rather than rebuilding",
    },
  })
  .env()
  .parseSync();

const envOptions = {
  env: {
    account: "163565994931",
    region: "ap-southeast-2",
  },
};

const app = new cdk.App();
const backendStack = new BackendStack(
  app,
  "BackendStack",
  { backendImageTag },
  envOptions
);
new FrontendStack(
  app,
  "FrontendStack",
  { backendUrl: "http://" + backendStack.alb.loadBalancerDnsName },
  envOptions
);
new LambdaFunctionsStack(
  app,
  "LambdaFunctions",
  {
    vpc: backendStack.vpc,
    databaseSecretName: backendStack.databaseSecretName,
    publicationsBucketName: backendStack.publicationsBucket.bucketName,
    serviceSecurityGroup: backendStack.serviceSecurityGroup,
  },
  envOptions
);
