import * as cdk from "@aws-cdk/core";
import * as apigateway from "@aws-cdk/aws-apigateway";
import { Function } from "@aws-cdk/aws-lambda";
import { FargateService } from "@aws-cdk/aws-ecs";
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
      requestTemplates: { "application/json": '{ "statusCode": "200" }' },
    });

    const fargateServiceIntegration = new apigateway.HttpIntegration(
      backendLoadBalancerEndpoint,
      { proxy: true }
    );
    const rootApiResource = api.root.addResource("api");
    const rootProxyMethod = rootApiResource.addProxy({
      anyMethod: true,
      defaultIntegration: fargateServiceIntegration,
    });
    const publishArticleResource = rootApiResource
      .addResource("articles")
      .addResource("publish");
    const publishArticleMethod = publishArticleResource.addMethod(
      "POST",
      lambdaIntegration
    );
  }
}
