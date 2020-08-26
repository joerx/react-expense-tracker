import * as cdk from "@aws-cdk/core";
import * as codepipeline from "@aws-cdk/aws-codepipeline";
import * as codepipeline_actions from "@aws-cdk/aws-codepipeline-actions";
import * as codebuild from "@aws-cdk/aws-codebuild";
import * as s3 from "@aws-cdk/aws-s3";
import { SecretValue } from "@aws-cdk/core";

export interface PipelineStackProps extends cdk.StackProps {
  readonly githubToken: string;
  readonly artifactBucketArn: string;
}

export class PipelineStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    const artifactBucket = s3.Bucket.fromBucketAttributes(this, "ImportedBucket", {
      bucketArn: props.artifactBucketArn,
    });

    // TODO: get this from SecretsManager
    const gitHubTokenSecret = SecretValue.plainText(props.githubToken);

    const pipeline = new codepipeline.Pipeline(this, "Pipeline", {
      artifactBucket,
    });

    // ** Codebuild project **

    const lambdaBuild = new codebuild.PipelineProject(this, "LambdaBuild", {
      buildSpec: codebuild.BuildSpec.fromSourceFilename("sam-app/buildspec.yml"),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_4_0,
      },
      environmentVariables: {
        S3_BUCKET: { value: artifactBucket.bucketName },
      },
    });

    // ** Code pipeline **

    const sourceOutput = new codepipeline.Artifact();
    const samBuildOutput = new codepipeline.Artifact("SamBuildOutput");

    pipeline.addStage({
      stageName: "Source",
      actions: [
        new codepipeline_actions.GitHubSourceAction({
          actionName: "GithubSource",
          output: sourceOutput,
          owner: "joerx",
          repo: "react-expense-tracker",
          oauthToken: gitHubTokenSecret,
          branch: "master",
        }),
      ],
    });

    pipeline.addStage({
      stageName: "Build",
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: "AwsSamBuild",
          project: lambdaBuild,
          input: sourceOutput,
          outputs: [samBuildOutput],
        }),
      ],
    });
  }
}
