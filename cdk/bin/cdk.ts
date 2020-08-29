#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { BackendPipelineStack } from "../lib/backend-pipeline-stack";
import { FrontendPipelineStack } from "../lib/frontend-pipeline-stack";
import { FrontendStack } from "../lib/frontend-stack";
import { GitHubRepoProps } from "../lib/shared";

const artifactBucketArn = "arn:aws:s3:::codepipeline-ap-southeast-1-nohcaid1";

const repo: GitHubRepoProps = {
  name: "react-expense-tracker",
  owner: "joerx",
  branch: "master",
  oauthToken: process.env.GITHUB_TOKEN || "", // TODO: SecretsManager
};

const app = new cdk.App();

const frontend = new FrontendStack(app, "ExpenseTrackerFrontendStack", {
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

new BackendPipelineStack(app, "ExpenseTrackerBackendPipeline", {
  frontendOriginUrl: `https://${frontend.distribution.domainName}`,
  artifactBucketArn,
  repo,
});

new FrontendPipelineStack(app, "ExpenseTrackerFrontendPipeline", {
  apiEndpoint: "https://yz46rtbmcf.execute-api.ap-southeast-1.amazonaws.com/v1", // Known only after initial deploy
  artifactBucketArn,
  frontend,
  repo,
});
