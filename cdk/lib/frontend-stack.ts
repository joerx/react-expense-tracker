import * as cdk from "@aws-cdk/core";
import * as s3 from "@aws-cdk/aws-s3";
import * as cloudfront from "@aws-cdk/aws-cloudfront";
import { IBucket } from "@aws-cdk/aws-s3";

export interface FrontendStackProps extends cdk.StackProps {
  removalPolicy?: cdk.RemovalPolicy;
}

export class FrontendStack extends cdk.Stack {
  public readonly bucket: IBucket;
  public readonly distribution: cloudfront.IDistribution;

  constructor(scope: cdk.Construct, id: string, props: FrontendStackProps = {}) {
    super(scope, id, props);

    const { removalPolicy = cdk.RemovalPolicy.DESTROY } = props;

    this.bucket = new s3.Bucket(this, "StaticWebContent", {
      publicReadAccess: false,
      removalPolicy: removalPolicy,
    });

    const oai = new cloudfront.OriginAccessIdentity(this, "OAI");
    this.bucket.grantRead(oai);

    this.distribution = new cloudfront.CloudFrontWebDistribution(this, "Dist", {
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      originConfigs: [
        {
          s3OriginSource: {
            s3BucketSource: this.bucket,
            originAccessIdentity: oai,
          },
          behaviors: [{ isDefaultBehavior: true }],
        },
      ],
    });

    new cdk.CfnOutput(this, "S3BucketName", {
      value: this.bucket.bucketName,
    });

    new cdk.CfnOutput(this, "CdnDomainName", {
      value: this.distribution.domainName,
    });
  }
}
