import * as cfn from "@aws-cdk/aws-cloudformation";
import * as codebuild from "@aws-cdk/aws-codebuild";
import * as codepipeline from "@aws-cdk/aws-codepipeline";
import * as codepipeline_actions from "@aws-cdk/aws-codepipeline-actions";
import * as s3 from "@aws-cdk/aws-s3";
import * as cdk from "@aws-cdk/core";
import { SecretValue } from "@aws-cdk/core";
import { GitHubRepoProps } from "./shared";

export interface BackendPipelineStackProps extends cdk.StackProps {
  readonly artifactBucketArn: string;
  readonly frontendOriginUrl: string;
  readonly repo: GitHubRepoProps;
}

export class BackendPipelineStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: BackendPipelineStackProps) {
    super(scope, id, props);

    const artifactBucket = s3.Bucket.fromBucketAttributes(this, "ImportedBucket", {
      bucketArn: props.artifactBucketArn,
    });

    // TODO: get this from SecretsManager
    if (!props.repo.oauthToken) {
      throw new Error("Missing GitHub oauthToken");
    }
    const gitHubTokenSecret = SecretValue.plainText(props.repo.oauthToken);

    const pipeline = new codepipeline.Pipeline(this, "Pipeline", {
      artifactBucket,
    });

    /** Codebuild project **/

    const lambdaBuild = new codebuild.PipelineProject(this, "LambdaBuild", {
      buildSpec: codebuild.BuildSpec.fromSourceFilename("sam-app/buildspec.yml"),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_4_0,
      },
      environmentVariables: {
        S3_BUCKET: { value: artifactBucket.bucketName },
      },
    });

    /** Code pipeline **/

    const sourceOutput = new codepipeline.Artifact();
    const samBuildOutput = new codepipeline.Artifact("SamBuildOutput");

    // Source stage

    pipeline.addStage({
      stageName: "Source",
      actions: [
        new codepipeline_actions.GitHubSourceAction({
          actionName: "GithubSource",
          output: sourceOutput,
          owner: props.repo.owner,
          repo: props.repo.name,
          oauthToken: gitHubTokenSecret,
          branch: props.repo.branch,
        }),
      ],
    });

    // Build stage

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

    // Deploy stage

    pipeline.addStage({
      stageName: "Deploy",
      actions: [
        new codepipeline_actions.CloudFormationCreateUpdateStackAction({
          actionName: "Lambda_CFN_Deploy",
          templatePath: samBuildOutput.atPath("sam-app/template-export.yml"),
          stackName: "ExpenseTrackerStack",
          adminPermissions: true,
          extraInputs: [samBuildOutput],
          capabilities: [cfn.CloudFormationCapabilities.AUTO_EXPAND, cfn.CloudFormationCapabilities.NAMED_IAM],
          parameterOverrides: {
            corsOriginParam: props.frontendOriginUrl,
          },
        }),
      ],
    });
  }
}
