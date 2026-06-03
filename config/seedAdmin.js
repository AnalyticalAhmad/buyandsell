const User = require("../models/User");
const { env } = require("./env");

function deriveUsernameFromEmail(email) {
  const local = (email.split("@")[0] || "admin").replace(/[^A-Za-z0-9_]/g, "_");
  let base = local.slice(0, 15);
  if (base.length < 3) {
    base = `usr_${local}`.replace(/[^A-Za-z0-9_]/g, "_").slice(0, 15);
  }
  if (base.length < 3) {
    base = "store_admin";
  }
  return base;
}

async function pickUniqueUsername(preferred) {
  let candidate = preferred.slice(0, 15);
  let suffix = 0;
  while (await User.findOne({ username: candidate })) {
    suffix += 1;
    const tail = `_${suffix}`;
    candidate = `${preferred}`.slice(0, 15 - tail.length) + tail;
    if (suffix > 1000) {
      candidate = `adm_${Date.now()}`.slice(0, 15);
      break;
    }
  }
  return candidate;
}

/**
 * Ensures env-defined admin exists: verified, role admin, password matches ADMIN_PASSWORD.
 * Uses save() so password pre-hash runs.
 */
async function seedAdminFromEnv() {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) {
    if (env.NODE_ENV === "development") {
      console.log("Admin seed skipped (set ADMIN_EMAIL and ADMIN_PASSWORD to enable).");
    }
    return;
  }

  const email = env.ADMIN_EMAIL;
  const plainPassword = env.ADMIN_PASSWORD;
  const name = env.ADMIN_NAME.length >= 3 ? env.ADMIN_NAME : "Store Admin";

  let user = await User.findOne({ email });

  if (user) {
    user.role = "admin";
    user.isVerified = true;
    user.password = plainPassword;
    user.verificationCode = undefined;
    user.verificationCodeExpiry = undefined;
    await user.save();
    console.log(`Admin user synced from env: ${email}`);
    return;
  }

  const preferredUsername = env.ADMIN_USERNAME || deriveUsernameFromEmail(email);
  const username = await pickUniqueUsername(
    preferredUsername.length >= 3 ? preferredUsername : deriveUsernameFromEmail(email)
  );

  await User.create({
    name,
    username,
    email,
    password: plainPassword,
    role: "admin",
    isVerified: true,
  });

  console.log(`Admin user created from env: ${email} (username: ${username})`);
}

module.exports = { seedAdminFromEnv };
