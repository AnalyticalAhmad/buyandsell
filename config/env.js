const dotenv = require("dotenv");

dotenv.config();

const env = {
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || 5001,
  MONGODB_URI: process.env.MONGODB_URI || "",
  JWT_SECRET: process.env.JWT_SECRET || "",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
  /** Bootstrap admin (synced on DB connect). Omit either to skip seeding. */
  ADMIN_EMAIL: (process.env.ADMIN_EMAIL || "").trim().toLowerCase(),
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "",
  ADMIN_NAME: (process.env.ADMIN_NAME || "Store Admin").trim() || "Store Admin",
  ADMIN_USERNAME: (process.env.ADMIN_USERNAME || "").trim(),
};

module.exports = { env };
