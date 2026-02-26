const db = require("../db");

const executeQuery = async (query, params = [], connection = null) => {
  return db.executeQuery(query, params, connection);
};

module.exports = {
  executeQuery,
};
