#!/usr/bin/env node
import * as cdk from "@aws-cdk/core";
import "source-map-support/register";
import { BackendStack } from "../lib/Backend";
import { FrontendStack } from "../lib/Frontend";
import { LambdaFunctionsStack } from "../lib/LambdaFunctions";
import * as yargs from "yargs";
import { GatewayStack } from "../lib/Gateway";

const envOptions = {
  env: {
    account: "163565994931",
    region: "ap-southeast-2",
  },
};

const app = new cdk.App();
const backendStack = new BackendStack(app, "BackendStack", {}, envOptions);
const backendLoadBalancerEndpoint =
  "http://" + backendStack.alb.loadBalancerDnsName;

const lambdaStack = new LambdaFunctionsStack(
  app,
  "LambdaFunctions",
  {
    vpc: backendStack.vpc,
    databaseSecretName: backendStack.databaseSecretName,
    publicationsBucket: backendStack.publicationsBucket,
    serviceSecurityGroup: backendStack.serviceSecurityGroup,
    analyticsBucket: backendStack.analyticsBucket,
  },
  envOptions
);

const gateway = new GatewayStack(
  app,
  "Gateway",
  {
    backendLambda: lambdaStack.function,
    backendLoadBalancerEndpoint,
  },
  envOptions
);

new FrontendStack(
  app,
  "FrontendStack",
  { backendUrl: gateway.api.url! },
  envOptions
);
