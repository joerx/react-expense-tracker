const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

const tableName = process.env.DYNAMODB_TABLE;

const awsOptions = {
  apiVersion: "2012-08-10",
  region: "ap-southeast-1",
};

if (process.env.AWS_SAM_LOCAL) {
  awsOptions.endpoint = new AWS.Endpoint("http://dynamodb:8000");
}

const dynamoDB = new AWS.DynamoDB(awsOptions);

class NotFoundError extends Error {
  statusCode = 500;

  constructor(message) {
    super(message);
    this.statusCode = 404;
  }
}

/**
 * A Lambda function that returns a static string
 */
exports.expenseHandler = async (event, context) => {
  try {
    let body = {};
    let statusCode = 200;

    const input = JSON.parse(event.body);

    switch (event.httpMethod) {
      case "GET":
        [statusCode, body] = await handleListTransactions();
        break;

      case "POST":
        [statusCode, body] = await handleAddTransaction(input);
        break;

      case "DELETE":
        console.log(event.pathParameters);
        const id = event.pathParameters.id;
        [statusCode, body] = await handleDeleteTransaction(id);
        break;
    }

    return {
      statusCode,
      body: JSON.stringify(body),
    };
  } catch (error) {
    return handleError(error);
  }
};

const handleError = (error) => {
  console.error(error);
  return {
    statusCode: error.statusCode || 500,
    body: JSON.stringify({ message: error.message }),
  };
};

const mapTransaction = (item) => {
  return { id: item.id.S, text: item.text.S, amount: item.amount.S };
};

const handleListTransactions = async () => {
  const params = {
    TableName: tableName,
  };

  // Note: doing a full scan for simplicity here, but it's generally expensive and won't scale as
  // the table grows larger. Better would be to pick a more sensible partition/sort key, then query
  // based on those: e.g. expenses for user X for the current day
  const res = await dynamoDB.scan(params).promise();
  return [200, { transactions: res.Items.map(mapTransaction) }];
};

const handleAddTransaction = async (body) => {
  const id = uuidv4();
  const params = {
    Item: {
      id: {
        S: id,
      },
      text: {
        S: body.text,
      },
      amount: {
        S: body.amount + "",
      },
    },
    TableName: tableName,
  };

  await dynamoDB.putItem(params).promise();
  const transaction = { ...body, id };

  return [201, { transaction }];
};

const getTransaction = async (id) => {
  const params = {
    Key: {
      id: {
        S: id,
      },
    },
    TableName: tableName,
  };

  const res = await dynamoDB.getItem(params).promise();

  if (!res.Item) {
    throw new NotFoundError("No transaction found");
  }

  return mapTransaction(res.Item);
};

const handleDeleteTransaction = async (id) => {
  var params = {
    Key: {
      id: {
        S: id,
      },
    },
    TableName: tableName,
  };

  const transaction = await getTransaction(id);
  await dynamoDB.deleteItem(params).promise();

  return [200, { transaction }];
};
