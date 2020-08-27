import * as cdk from "@aws-cdk/core";
import * as s3 from "@aws-cdk/aws-s3";
import * as cloudfront from "@aws-cdk/aws-cloudfront";

export interface FrontendStackProps extends cdk.StackProps {
  removalPolicy?: cdk.RemovalPolicy;
}

export class FrontendStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: FrontendStackProps = {}) {
    super(scope, id, props);

    const { removalPolicy = cdk.RemovalPolicy.DESTROY } = props;

    const bucket = new s3.Bucket(this, "StaticWebContent", {
      publicReadAccess: false,
      removalPolicy: removalPolicy,
    });

    const oai = new cloudfront.OriginAccessIdentity(this, "OAI");
    bucket.grantRead(oai);

    const dist = new cloudfront.CloudFrontWebDistribution(this, "Dist", {
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: bucket,
            originAccessIdentity: oai,
          },
          behaviors: [{ isDefaultBehavior: true }],
        },
      ],
    });

    new cdk.CfnOutput(this, "S3BucketName", {
      value: bucket.bucketName,
    });

    new cdk.CfnOutput(this, "CdnDomainName", {
      value: dist.domainName,
    });
  }
}
