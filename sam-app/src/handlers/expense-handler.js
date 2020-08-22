const transactionsController = require("../controllers/transactions");

class MethodNotAllowed extends Error {
  statusCode = 405;

  constructor(message) {
    super(message);
  }
}

/**
 * Main lambda proxy handler
 * @param {*} event Lambda event
 * @param {*} context Lambda execution context
 */
exports.expenseHandler = async (event, context) => {
  try {
    const res = {
      statusCode: 200,
      headers: { "Content-type": "application/json" },
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
