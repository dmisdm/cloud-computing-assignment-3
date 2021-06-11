#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { BackendStack } from "../lib/Backend";
import { FrontendStack } from "../lib/Frontend";

const envOptions = {
  env: {
    account: "163565994931",
    region: "ap-southeast-2",
  },
};

const app = new cdk.App();
new FrontendStack(app, "FrontendStack", envOptions);
new BackendStack(app, "BackendStack", envOptions);
