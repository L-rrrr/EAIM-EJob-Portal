const jwt = require("jsonwebtoken");

const secretKey = process.env.JWT_SECRET;

const generateToken = (payload) => {
  return jwt.sign(payload, secretKey, { algorithm: "HS256", expiresIn: "2h" });
};

const verifyToken = (token) => {
  return jwt.verify(token, secretKey);
};

module.exports = {
  generateToken,
  verifyToken,
};
