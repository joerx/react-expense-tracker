const AWS = require("aws-sdk");

const distId = process.env.CF_DISTRIBUTION_ID;

const cloudfront = new AWS.CloudFront();

exports.handler = async (event, context) => {
  console.log(event);

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

  return await cloudfront.createInvalidation(params).promise();
};
