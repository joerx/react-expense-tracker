import * as cdk from "@aws-cdk/core";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import * as iam from "@aws-cdk/aws-iam";
import * as lambda from "@aws-cdk/aws-lambda";
import * as path from "path";

export interface CacheBusterParams {
  readonly distribution: cloudfront.IDistribution;
}

/**
 * Lambda function to invalidate CloudFront CDN cache
 */
export class CacheBuster extends cdk.Construct {
  public readonly lambda: lambda.IFunction;

  constructor(scope: cdk.Construct, id: string, props: CacheBusterParams) {
    super(scope, id);

    const accountId = cdk.Stack.of(this).account;

    const basicLambdaPolicy = iam.ManagedPolicy.fromManagedPolicyArn(
      this,
      "basicLambdaPolicy",
      "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
    );

    const cacheBusterRole = new iam.Role(this, "CacheBusterExecRole", {
      assumedBy: new iam.ServicePrincipal("lambda.amazonaws.com"),
    });

    cacheBusterRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ["cloudfront:CreateInvalidation"],
        resources: [`arn:aws:cloudfront::${accountId}:distribution/${props.distribution.distributionId}`],
      })
    );
    cacheBusterRole.addManagedPolicy(basicLambdaPolicy);

    this.lambda = new lambda.Function(this, "Fn", {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "lambda")),
      role: cacheBusterRole,
      environment: {
        CF_DISTRIBUTION_ID: props.distribution.distributionId,
      },
    });
  }
}
