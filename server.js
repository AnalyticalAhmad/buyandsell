require("./config/nodeCrypto");

const app = require("./app");
const { connectDB } = require("./config/db");
const { env } = require("./config/env");

async function startServer() {
  try {
    await connectDB();

    app.listen(env.PORT, () => {

      console.log(`Server running on port ${env.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
}

startServer();
