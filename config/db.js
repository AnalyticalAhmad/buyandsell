const mongoose = require("mongoose");
const { env } = require("./env");
const { seedAdminFromEnv } = require("./seedAdmin");
const { seedCategories } = require("./seedCategories");

async function connectDB() {
  if (!env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing from environment variables.");
  }

  mongoose.set("strictQuery", true);

  const connection = await mongoose.connect(env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  });

  console.log(
    `MongoDB connected: ${connection.connection.host}/${connection.connection.name}`
  );

  await seedAdminFromEnv();
  await seedCategories();
}

module.exports = { connectDB };
