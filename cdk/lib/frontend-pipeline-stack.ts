import * as cdk from "@aws-cdk/core";
import * as cfn from "@aws-cdk/aws-cloudformation";
import * as codebuild from "@aws-cdk/aws-codebuild";
import * as codepipeline from "@aws-cdk/aws-codepipeline";
import * as codepipeline_actions from "@aws-cdk/aws-codepipeline-actions";
import * as s3 from "@aws-cdk/aws-s3";
import { GitHubRepoProps } from "./shared";
import { FrontendStack } from "./frontend-stack";
import * as lambda from "@aws-cdk/aws-lambda";
import * as path from "path";
import * as iam from "@aws-cdk/aws-iam";

export interface FrontendPipelineStackProps extends cdk.StackProps {
  readonly artifactBucketArn: string;
  readonly apiEndpoint: string;
  readonly repo: GitHubRepoProps;
  readonly frontend: FrontendStack;
}

/**
 * CDK stack that deploys the frontend code pipeline. The pipeline will build and deploy the
 * frontend react application itself as well as update the CDK stack for the underlying
 * infrastructure as needed.
 */
export class FrontendPipelineStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: FrontendPipelineStackProps) {
    super(scope, id, props);

    const accountId = cdk.Stack.of(this).account;

    // Global bucket for artifacts
    const artifactBucket = s3.Bucket.fromBucketAttributes(this, "ImportedBucket", {
      bucketArn: props.artifactBucketArn,
    });

    // TODO: should be in SecretsManager
    if (!props.repo.oauthToken) {
      throw new Error("Missing GitHub oauthToken");
    }
    const gitHubTokenSecret = cdk.SecretValue.plainText(props.repo.oauthToken);

    // Lambda function to invalidate CDN cache
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
        resources: [`arn:aws:cloudfront::${accountId}:distribution/${props.frontend.distribution.distributionId}`],
      })
    );
    cacheBusterRole.addManagedPolicy(basicLambdaPolicy);

    const cacheBuster = new lambda.Function(this, "CacheBuster", {
      runtime: lambda.Runtime.NODEJS_12_X,
      handler: "index.handler",
      code: lambda.Code.fromAsset(path.join(__dirname, "cache-buster")),
      role: cacheBusterRole,
      environment: {
        CF_DISTRIBUTION_ID: props.frontend.distribution.distributionId,
      },
    });

    const pipeline = new codepipeline.Pipeline(this, "Pipeline", {
      artifactBucket,
    });

    // Frontend build step, compiles react-based app into static JS
    const reactBuild = new codebuild.PipelineProject(this, "ReactBuild", {
      buildSpec: codebuild.BuildSpec.fromSourceFilename("frontend/buildspec.yml"),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_4_0,
      },
      environmentVariables: {
        REACT_APP_API_ENDPOINT: { value: props.apiEndpoint },
      },
    });

    // CDK step, synthesizes the CDK stack for the frontend resources into a CFN
    // template we can pass to a CloudFormationCreateUpdateStackAction
    const cdkBuild = new codebuild.PipelineProject(this, "CdkBuild", {
      buildSpec: codebuild.BuildSpec.fromSourceFilename("cdk/buildspec-frontend.yml"),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_4_0,
      },
    });

    const sourceOutput = new codepipeline.Artifact();
    const reactBuildOutput = new codepipeline.Artifact("ReactBuild");
    const cdkBuildOutput = new codepipeline.Artifact("CdkBuild");

    // Setup pipeline.
    pipeline.addStage({
      stageName: "Source",
      actions: [
        // Source is pulled from GitHub
        new codepipeline_actions.GitHubSourceAction({
          actionName: "GithubSource",
          output: sourceOutput,
          owner: props.repo.owner,
          repo: props.repo.name, // ,
          oauthToken: gitHubTokenSecret,
          branch: props.repo.branch,
        }),
      ],
    });

    // Build stage
    pipeline.addStage({
      stageName: "Build",
      actions: [
        // Synthesize CDK code into CFN template
        new codepipeline_actions.CodeBuildAction({
          actionName: "CdkBuild",
          project: cdkBuild,
          input: sourceOutput,
          outputs: [cdkBuildOutput],
        }),
        // Compile the frontend ReactJS app
        new codepipeline_actions.CodeBuildAction({
          actionName: "ReactBuild",
          project: reactBuild,
          input: sourceOutput,
          outputs: [reactBuildOutput],
        }),
      ],
    });

    // Deploy stage
    pipeline.addStage({
      stageName: "Deploy",
      actions: [
        // Deploy AWS resources as CFN stack
        new codepipeline_actions.CloudFormationCreateUpdateStackAction({
          actionName: "CdkStackDeploy",
          templatePath: cdkBuildOutput.atPath("ExpenseTrackerFrontendStack.yml"),
          stackName: props.frontend.stackName,
          adminPermissions: true,
          extraInputs: [cdkBuildOutput],
          capabilities: [cfn.CloudFormationCapabilities.AUTO_EXPAND, cfn.CloudFormationCapabilities.NAMED_IAM],
        }),
        // Frontend is deployed as static webapp to S3
        new codepipeline_actions.S3DeployAction({
          input: reactBuildOutput,
          bucket: props.frontend.bucket,
          actionName: "S3Deploy",
        }),
      ],
    });

    pipeline.addStage({
      stageName: "PostDeploy",
      actions: [
        new codepipeline_actions.LambdaInvokeAction({
          actionName: "CacheBuster",
          lambda: cacheBuster,
        }),
      ],
    });
  }
}
