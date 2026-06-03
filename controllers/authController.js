
const crypto = require("crypto");
const User = require("../models/User");
const { env } = require("../config/env");
const { sendEmail } = require("../utils/emailSender");
const { generateToken } = require("../utils/generateToken");

const passwordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const RESET_OTP_EXPIRY_MS = 10 * 60 * 1000;
const VERIFICATION_CODE_EXPIRY_MS = 10 * 60 * 1000;

function sanitizeRegisterPayload(body) {
  return {
    name: String(body.name || body.fullName || "").trim().replace(/\s+/g, " "),
    username: String(body.username || "").trim(),
    email: String(body.email || "").trim().toLowerCase(),
    password: String(body.password || "").trim(),
  };
}

function validatePassword(password) {
  return passwordPattern.test(password);
}

function hashValue(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

function createVerificationCode() {
  return crypto.randomInt(100000, 999999).toString();
}

async function register(req, res, next) {
  try {
    const { name, username, email, password } = sanitizeRegisterPayload(req.body);

    if (!name || !username || !email || !password) {
      return res.status(400).json({ success: false, message: "All fields are required." });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters and include uppercase, number, and special character.",
      });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(409).json({ success: false, message: "Email is already registered." });
    }

    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.status(409).json({ success: false, message: "Username is already taken." });
    }

    const verificationCode = createVerificationCode();
    const user = await User.create({
      name,
      username,
      email,
      password,
      verificationCode: hashValue(verificationCode),
      verificationCodeExpiry: new Date(Date.now() + VERIFICATION_CODE_EXPIRY_MS),
    });

    await sendEmail({
      to: user.email,
      subject: "Verify your Buy&Sell account",
      text: `Your Buy&Sell verification OTP is ${verificationCode}. It expires in 10 minutes.`,
    });

    res.status(201).json({
      success: true,
      message: "Account created successfully. Verification OTP sent to email.",
      ...(env.NODE_ENV === "development" ? { otp: verificationCode } : {}),
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function verifyEmail(req, res, next) {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const otp = String(req.body.otp || req.body.verificationCode || "").trim();

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required." });
    }

    const user = await User.findOne({
      email,
      verificationCode: hashValue(otp),
      verificationCodeExpiry: { $gt: new Date() },
    }).select("+verificationCode +verificationCodeExpiry");

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired verification OTP." });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpiry = undefined;
    await user.save();

    res.status(200).json({ success: true, message: "Email verified successfully." });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const identifier = String(req.body.identifier || req.body.emailOrUsername || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!identifier || !password) {
      return res.status(400).json({ success: false, message: "Email/username and password are required." });
    }

    const user = await User.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    }).select("+password");

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: "Invalid login credentials." });
    }

    if (!user.isVerified) {
      return res.status(403).json({ success: false, message: "Please verify your email before logging in." });
    }

    const token = generateToken({ userId: user._id });

    res.status(200).json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    next(error);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    const user = await User.findOne({ email }).select("+resetPasswordToken +resetPasswordExpiry");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "This email is not associated with this account.",
      });
    }

    const resetOtp = createVerificationCode();
    user.resetPasswordToken = hashValue(resetOtp);
    user.resetPasswordExpiry = new Date(Date.now() + RESET_OTP_EXPIRY_MS);
    await user.save();

    await sendEmail({
      to: user.email,
      subject: "Reset your Buy&Sell password",
      text: `Your Buy&Sell password reset OTP is ${resetOtp}. It expires in 10 minutes.`,
    });

    res.status(200).json({
      success: true,
      message: "Password reset OTP sent.",
      ...(env.NODE_ENV === "development" ? { otp: resetOtp } : {}),
    });
  } catch (error) {
    next(error);
  }
}

async function verifyResetOtp(req, res, next) {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const otp = String(req.body.otp || "").trim();

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required." });
    }

    const user = await User.findOne({
      email,
      resetPasswordToken: hashValue(otp),
      resetPasswordExpiry: { $gt: new Date() },
    }).select("+resetPasswordToken +resetPasswordExpiry");

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset OTP." });
    }

    res.status(200).json({ success: true, message: "Reset OTP verified successfully." });
  } catch (error) {
    next(error);
  }
}

async function resetPassword(req, res, next) {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const token = String(req.body.token || req.body.otp || req.body.resetPasswordToken || "").trim();
    const password = String(req.body.password || "").trim();

    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters and include uppercase, number, and special character.",
      });
    }

    const user = await User.findOne({
      email,
      resetPasswordToken: hashValue(token),
      resetPasswordExpiry: { $gt: new Date() },
    }).select("+password +resetPasswordToken +resetPasswordExpiry");

    if (!user) {
      return res.status(400).json({ success: false, message: "Invalid or expired reset OTP." });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();

    res.status(200).json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  forgotPassword,
  login,
  register,
  resetPassword,
  verifyResetOtp,
  verifyEmail,
};
