#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { BackendPipelineStack } from "../lib/backend-pipeline-stack";
import { FrontendPipelineStack } from "../lib/frontend-pipeline-stack";
import { FrontendStack } from "../lib/frontend-stack";

const app = new cdk.App();

const frontend = new FrontendStack(app, "ExpenseTrackerFrontendStack", {
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});

new BackendPipelineStack(app, "ExpenseTrackerBackendPipeline", {
  githubToken: process.env.GITHUB_TOKEN || "",
  artifactBucketArn: "arn:aws:s3:::codepipeline-ap-southeast-1-nohcaid1",
});

new FrontendPipelineStack(app, "ExpenseTrackerFrontendPipeline", {
  githubToken: process.env.GITHUB_TOKEN || "",
  artifactBucketArn: "arn:aws:s3:::codepipeline-ap-southeast-1-nohcaid1",
  bucket: frontend.bucket,
  apiEndpoint: "https://yz46rtbmcf.execute-api.ap-southeast-1.amazonaws.com", // Known only after initial deploy
});
