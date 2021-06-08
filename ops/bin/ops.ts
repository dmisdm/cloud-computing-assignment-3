#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { BackendStack } from "../lib/stack";

const app = new cdk.App();
new BackendStack(app, "BackendStack", {
  env: {
    account: "163565994931",
    region: "ap-southeast-2",
  },
});
