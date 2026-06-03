const jwt = require("jsonwebtoken");
const { env } = require("../config/env");

function generateToken(payload) {
  if (!env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing from environment variables.");
  }

  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
}

module.exports = { generateToken };
