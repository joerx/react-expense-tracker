const transactionsController = require("../controllers/transactions");

const corsOrigin = process.env.CORS_ORIGIN || "http://localhost";

class MethodNotAllowed extends Error {
  statusCode = 405;

  constructor(message) {
    super(message);
  }
}

const passThru = async (req, res) => {};

/**
 * Main lambda proxy handler
 * @param {*} event Lambda event
 * @param {*} context Lambda execution context
 */
exports.expenseHandler = async (event, context) => {
  try {
    const res = {
      statusCode: 200,
      headers: {
        "Content-type": "application/json",
        "Access-Control-Allow-Headers": "X-Forwarded-For,Content-Type",
        "Access-Control-Allow-Origin": corsOrigin,
        "Access-Control-Allow-Methods": "OPTIONS,POST,GET",
      },
      body: {},
    };

    let req = event;
    if (typeof event.body === "string") {
      req = { ...event, body: JSON.parse(event.body) };
    }

    let handler = async (req, res) => {
      throw new MethodNotAllowed("Method not allowed");
    };

    switch (event.httpMethod) {
      case "GET":
        handler = transactionsController.findAll;
        break;

      case "POST":
        handler = transactionsController.create;
        break;

      case "DELETE":
        handler = transactionsController.delete;
        break;

      case "OPTIONS":
        handler = passThru;
        break;
    }

    await handler(req, res);

    return { ...res, body: JSON.stringify(res.body) };
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
