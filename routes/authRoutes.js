const express = require("express");
const {
  forgotPassword,
  login,
  register,
  resetPassword,
  verifyEmail,
  verifyResetOtp,
} = require("../controllers/authController");

const router = express.Router();

router.post("/register", register);
router.post("/verify-email", verifyEmail);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/verify-reset-otp", verifyResetOtp);
router.post("/reset-password", resetPassword);

module.exports = router;
