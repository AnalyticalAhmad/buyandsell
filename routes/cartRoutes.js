const express = require("express");
const {
  addToCart,
  clearCart,
  getCart,
  removeFromCart,
  updateCartQuantity,
} = require("../controllers/cartController");
const { protect, buyerOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/add", protect, buyerOnly, addToCart);
router.get("/", protect, buyerOnly, getCart);
router.put("/:productId", protect, buyerOnly, updateCartQuantity);
router.delete("/clear", protect, buyerOnly, clearCart);
router.delete("/:productId", protect, buyerOnly, removeFromCart);

module.exports = router;
