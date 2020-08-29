const AWS = require("aws-sdk");

const distId = process.env.CF_DISTRIBUTION_ID;

const cloudfront = new AWS.CloudFront();
const codepipeline = new AWS.CodePipeline();

const putJobSuccess = async (jobId) => {
  if (!jobId) {
    console.log("No job id, skipping job notification");
    return;
  }

  await codepipeline.putJobSuccessResult({ jobId }).promise();
};

const putJobFailure = async (jobId, message, context) => {
  if (!jobId) {
    console.log("No job id, skipping job notification");
    return;
  }

  const params = {
    jobId: jobId,
    failureDetails: {
      message: JSON.stringify(message),
      type: "JobFailed",
      externalExecutionId: context.awsRequestId,
    },
  };

  await codepipeline.putJobFailureResult(params).promise();
};

exports.handler = async (event, context) => {
  let jobId = null;
  if (event["CodePipeline.job"]) {
    jobId = event["CodePipeline.job"].id;
    console.log("Event for jobId", jobId);
  }

  try {
    const params = {
      DistributionId: distId,
      InvalidationBatch: {
        CallerReference: Date.now().toString(),
        Paths: {
          Quantity: "1",
          Items: ["/*"],
        },
      },
    };

    const res = await cloudfront.createInvalidation(params).promise();
    await putJobSuccess(jobId);
    return res;
  } catch (err) {
    await putJobFailure(jobId, err.message, context);
  }
};
