const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { env } = require("../config/env");

async function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    if (!token) {
      return res.status(401).json({ success: false, message: "Authentication token is required." });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ success: false, message: "User no longer exists." });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: "Invalid or expired token." });
  }
}

function adminOnly(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Authentication required." });
  }
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Admin access required." });
  }
  next();
}

function buyerOnly(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Authentication required." });
  }
  if (req.user.role === "admin") {
    return res.status(403).json({
      success: false,
      message: "Buyer accounts only. Admins cannot add items to the cart.",
    });
  }
  next();
}

module.exports = { adminOnly, buyerOnly, protect };
