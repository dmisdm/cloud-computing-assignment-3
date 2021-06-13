import * as cdk from "@aws-cdk/core";
import * as apigateway from "@aws-cdk/aws-apigateway";
import { Function } from "@aws-cdk/aws-lambda";

import { RestApi } from "@aws-cdk/aws-apigateway";
export class GatewayStack extends cdk.Stack {
  api: RestApi;
  constructor(
    scope: cdk.Construct,
    id: string,
    {
      // We depend on the backend lambda, and the ECS load balancer endpoint, for configuring a unified Gateway
      backendLambda,
      backendLoadBalancerEndpoint,
    }: { backendLambda: Function; backendLoadBalancerEndpoint: string },
    props?: cdk.StackProps
  ) {
    super(scope, id, props);

    // The root api gateway construct
    const api = new apigateway.RestApi(this, "BackendFederatedApi", {
      restApiName: "Backend",
      description:
        "The API that federates every other backend/api within our stack into one",
    });

    this.api = api;

    // The integration that describes how to forward requests to the Lambda.
    const lambdaIntegration = new apigateway.LambdaIntegration(backendLambda, {
      proxy: true,
    });

    // The integration that describes how to forward requests to our ECS service.
    // Nothing is specific to ECS here, it is more abstractly defined as a HTTP proxy/integration
    const fargateServiceIntegration = new apigateway.HttpIntegration(
      `${backendLoadBalancerEndpoint}/api/{proxy}`,
      {
        proxy: true,
        httpMethod: "ANY",
        options: {
          requestParameters: {
            "integration.request.path.proxy": "method.request.path.proxy",
          },
        },
      }
    );

    // The /api resource
    const rootApiResource = api.root.addResource("api");

    // This enables all traffic to forward to the ECS service on `/api/{proxy+}` as a fallback.
    const ecsServiceProxyMethod = rootApiResource.addProxy({
      anyMethod: true,
      defaultIntegration: fargateServiceIntegration,
      defaultMethodOptions: {
        requestParameters: {
          "method.request.path.proxy": true,
        },
      },
    });

    // The /api/articles/publish resource
    const publishArticleResource = rootApiResource
      .addResource("articles")
      .addResource("publish");

    // The /api/articles/publish POST method, that integrates with the backend lambda.
    const publishArticleMethod = publishArticleResource.addMethod(
      "POST",
      lambdaIntegration
    );

    // Similarly, this allocates /api/run-analytics-job to use the lambda.
    const analyticsJob = rootApiResource.addResource("run-analytics-job");
    analyticsJob.addMethod("POST", lambdaIntegration);
  }
}
