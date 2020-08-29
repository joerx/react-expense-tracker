import * as cdk from "@aws-cdk/core";
import * as cfn from "@aws-cdk/aws-cloudformation";
import * as codebuild from "@aws-cdk/aws-codebuild";
import * as codepipeline from "@aws-cdk/aws-codepipeline";
import * as codepipeline_actions from "@aws-cdk/aws-codepipeline-actions";
import * as s3 from "@aws-cdk/aws-s3";

export interface FrontendPipelineStackProps extends cdk.StackProps {
  readonly bucket: s3.IBucket;
  readonly artifactBucketArn: string;
  readonly githubToken: string;
  readonly apiEndpoint: string;
  readonly sourceBranch: string;
  readonly frontendStackName: string;
}

export class FrontendPipelineStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: FrontendPipelineStackProps) {
    super(scope, id, props);

    const artifactBucket = s3.Bucket.fromBucketAttributes(this, "ImportedBucket", {
      bucketArn: props.artifactBucketArn,
    });

    const gitHubTokenSecret = cdk.SecretValue.plainText(props.githubToken);

    const pipeline = new codepipeline.Pipeline(this, "Pipeline", {
      artifactBucket,
    });

    const reactBuild = new codebuild.PipelineProject(this, "ReactBuild", {
      buildSpec: codebuild.BuildSpec.fromSourceFilename("frontend/buildspec.yml"),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_4_0,
      },
      environmentVariables: {
        REACT_APP_API_ENDPOINT: { value: props.apiEndpoint },
      },
    });

    const cdkBuild = new codebuild.PipelineProject(this, "CdkBuild", {
      buildSpec: codebuild.BuildSpec.fromSourceFilename("cdk/buildspec-frontend.yml"),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_4_0,
      },
    });

    const sourceOutput = new codepipeline.Artifact();
    const reactBuildOutput = new codepipeline.Artifact("ReactBuild");
    const cdkBuildOutput = new codepipeline.Artifact("CdkBuild");

    pipeline.addStage({
      stageName: "Source",
      actions: [
        new codepipeline_actions.GitHubSourceAction({
          actionName: "GithubSource",
          output: sourceOutput,
          owner: "joerx",
          repo: "react-expense-tracker",
          oauthToken: gitHubTokenSecret,
          branch: props.sourceBranch,
        }),
      ],
    });

    pipeline.addStage({
      stageName: "Build",
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: "CdkBuild",
          project: cdkBuild,
          input: sourceOutput,
          outputs: [cdkBuildOutput],
        }),
        new codepipeline_actions.CodeBuildAction({
          actionName: "ReactBuild",
          project: reactBuild,
          input: sourceOutput,
          outputs: [reactBuildOutput],
        }),
      ],
    });

    pipeline.addStage({
      stageName: "Deploy",
      actions: [
        new codepipeline_actions.CloudFormationCreateUpdateStackAction({
          actionName: "CdkStackDeploy",
          templatePath: cdkBuildOutput.atPath("ExpenseTrackerFrontendStack.yml"),
          stackName: props.frontendStackName,
          adminPermissions: true,
          extraInputs: [cdkBuildOutput],
          capabilities: [cfn.CloudFormationCapabilities.AUTO_EXPAND, cfn.CloudFormationCapabilities.NAMED_IAM],
        }),
        new codepipeline_actions.S3DeployAction({
          input: reactBuildOutput,
          bucket: props.bucket,
          actionName: "S3Deploy",
        }),
      ],
    });
  }
}
