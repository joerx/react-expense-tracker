const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");

const awsOptions = {
  apiVersion: "2012-08-10",
  region: "ap-southeast-1",
};

const tableName = process.env.DYNAMODB_TABLE;

if (process.env.AWS_SAM_LOCAL) {
  awsOptions.endpoint = new AWS.Endpoint("http://dynamodb:8000");
}

const dynamoDB = new AWS.DynamoDB(awsOptions);

class NotFoundError extends Error {
  statusCode = 404;

  constructor(message) {
    super(message);
  }
}

class ValidationError extends Error {
  statusCode = 400;

  constructor(message) {
    super(message);
  }
}

const mapTransaction = (item) => {
  return { id: item.id.S, text: item.text.S, amount: item.amount.S };
};

/**
 * Handle GET /transactions - list all transactions currently available
 * @param {*} req Request data
 * @param {*} res Response object
 */
module.exports.findAll = async (req, res) => {
  const params = {
    TableName: tableName,
  };

  // Note: doing a full scan for simplicity here, but it's generally expensive and won't scale as
  // the table grows larger. Better would be to pick a more sensible partition/sort key, then query
  // based on those: e.g. expenses for user X for the current day
  const resp = await dynamoDB.scan(params).promise();

  res.body = { transactions: resp.Items.map(mapTransaction) };
};

/**
 * Handle POST /transactions - store a new transaction in the database
 * @param {*} req Request data
 * @param {*} res Response object
 */
module.exports.create = async (req, res) => {
  validateTransaction(req.body);

  const id = uuidv4();
  const { text, amount } = req.body;

  const params = {
    Item: {
      id: { S: id },
      text: { S: text },
      amount: { S: amount.toFixed(2) },
    },
    TableName: tableName,
  };

  await dynamoDB.putItem(params).promise();

  res.statusCode = 201;
  res.body = { transaction: { text, amount, id } };
};

/**
 * Handle DELETE /transactions/{id} - delete transaction identified by `{id}`
 * @param {*} req request data
 * @param {*} res response object
 */
module.exports.delete = async (req, res) => {
  const id = req.pathParameters.id;
  const params = {
    Key: {
      id: { S: id },
    },
    TableName: tableName,
  };

  const transaction = await getTransaction(id);
  await dynamoDB.deleteItem(params).promise();

  res.body = { transaction };
};

/**
 * Validate that the given data object is a valid transaction, throw a ValidationError otherwise
 * @param {*} data
 */
const validateTransaction = (data) => {
  if (!data) {
    throw new ValidationError("Request data cannot be empty");
  }
  if (!data.text || data.text.trim() === "") {
    throw new ValidationError("Test must be set and non-empty");
  }
  if (!data.amount || Number(data.amount) === 0) {
    throw new ValidationError("Amount must be set an non-empty");
  }
};

/**
 * Get the transaction identified by `id`, throw a NotFoundError if no such transacton exists
 * @param {string} id Transaction id to find
 */
const getTransaction = async (id) => {
  const params = {
    Key: {
      id: { S: id },
    },
    TableName: tableName,
  };

  const res = await dynamoDB.getItem(params).promise();

  if (!res.Item) {
    throw new NotFoundError("No transaction found");
  }

  return mapTransaction(res.Item);
};
