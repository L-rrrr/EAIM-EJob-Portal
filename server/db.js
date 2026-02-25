var mysql = require("mysql2");
require("dotenv").config();

var conStr = {
  // Live
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  connectionLimit: 10,
  port: 3306,
  timezone: "SGT",
};
var pool = mysql.createPool(conStr);

let beginTransaction = () => {
  return new Promise((resolve, reject) => {
    pool.getConnection((error, connection) => {
      if (error) {
        return reject(error);
      }
      connection.beginTransaction((err) => {
        if (err) {
          connection.release(); 
          return reject(err);
        }
        resolve(connection); 
      });
    });
  });
};

let executeQuery = (query, params = [], connection = null) => {
  return new Promise((resolve, reject) => {
    const queryCallback = (conn) => {
      conn.query(query, params, (error, results) => {
        if (!connection) conn.release(); // only release if it's not part of a transaction
        if (error) {
          return reject(error);
        }
        resolve(results);
      });
    };

    if (connection) {
      queryCallback(connection); // use the provided connection
    } else {
      pool.getConnection((err, conn) => {
        if (err) return reject(err);
        queryCallback(conn); // standalone query
      });
    }
  });
};

let commitTransaction = (connection) => {
  return new Promise((resolve, reject) => {
    if (!connection) {
      return reject(new Error("No connection provided for commit"));
    }
    connection.commit((err) => {
      if (err) {
        connection.rollback(() => {
          connection.release(); 
          reject(err);
        });
      } else {
        connection.release(); 
        resolve();
      }
    });
  });
};

let rollbackTransaction = (connection) => {
  return new Promise((resolve, reject) => {
    if (!connection) {
      console.error("No connection provided for rollback");
      return resolve(); 
    }
    connection.rollback(() => {
      connection.release(); 
      resolve();
    });
  });
};


module.exports = {
  executeQuery,
  beginTransaction,
  commitTransaction,
  rollbackTransaction,
};