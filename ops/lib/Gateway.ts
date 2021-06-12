import * as cdk from "@aws-cdk/core";
import * as apigateway from "@aws-cdk/aws-apigatewayv2";
import {
  LambdaProxyIntegration,
  HttpProxyIntegration,
} from "@aws-cdk/aws-apigatewayv2-integrations";
import { Function } from "@aws-cdk/aws-lambda";

export class GatewayStack extends cdk.Stack {
  api: apigateway.HttpApi;
  constructor(
    scope: cdk.Construct,
    id: string,
    {
      backendLambda,
      backendLoadBalancerEndpoint,
    }: { backendLambda: Function; backendLoadBalancerEndpoint: string },
    props?: cdk.StackProps
  ) {
    super(scope, id, props);

    const api = new apigateway.HttpApi(this, "BackendFederatedApi", {
      createDefaultStage: true,
      apiName: "Backend",
      description:
        "The API that federates every other backend/api within our stack into one",
    });

    this.api = api;

    const lambdaIntegration = new LambdaProxyIntegration({
      handler: backendLambda,
    });

    const fargateServiceIntegration = new HttpProxyIntegration({
      url: `${backendLoadBalancerEndpoint}/api/{proxy}`,
    });
    api.addRoutes({
      integration: fargateServiceIntegration,
      path: "/api/{proxy+}",
      methods: [apigateway.HttpMethod.ANY],
    });
    api.addRoutes({
      integration: lambdaIntegration,
      path: "/api/articles/publish",
      methods: [apigateway.HttpMethod.ANY],
    });
  }
}
