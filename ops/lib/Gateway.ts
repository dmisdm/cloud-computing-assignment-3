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
      backendLambda,
      backendLoadBalancerEndpoint,
    }: { backendLambda: Function; backendLoadBalancerEndpoint: string },
    props?: cdk.StackProps
  ) {
    super(scope, id, props);

    const api = new apigateway.RestApi(this, "BackendFederatedApi", {
      restApiName: "Backend",
      description:
        "The API that federates every other backend/api within our stack into one",
    });

    this.api = api;

    const lambdaIntegration = new apigateway.LambdaIntegration(backendLambda, {
      proxy: true,
    });

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
    const rootApiResource = api.root.addResource("api");
    const rootProxyMethod = rootApiResource.addProxy({
      anyMethod: true,
      defaultIntegration: fargateServiceIntegration,
      defaultMethodOptions: {
        requestParameters: {
          "method.request.path.proxy": true,
        },
      },
    });

    const publishArticleResource = rootApiResource
      .addResource("articles")
      .addResource("publish");
    const publishArticleMethod = publishArticleResource.addMethod(
      "POST",
      lambdaIntegration
    );

    const analyticsJob = rootApiResource.addResource("run-analytics-job");
    analyticsJob.addMethod("POST", lambdaIntegration);
  }
}
