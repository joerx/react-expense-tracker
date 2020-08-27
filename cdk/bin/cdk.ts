#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { PipelineStack } from "../lib/pipeline-stack";

const app = new cdk.App();
new PipelineStack(app, "ExpenseTrackerCodePipeline", {
  githubToken: process.env.GITHUB_TOKEN || "",
  artifactBucketArn: "arn:aws:s3:::codepipeline-ap-southeast-1-nohcaid1",
});
