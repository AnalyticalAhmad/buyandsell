const mongoose = require("mongoose");
const Cart = require("../models/Cart");
const Product = require("../models/Product");

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function computeTotals(items) {
  let totalPrice = 0;
  let itemCount = 0;
  for (const line of items) {
    totalPrice += line.price * line.quantity;
    itemCount += line.quantity;
  }
  return { totalPrice, itemCount };
}

async function getOrCreateCart(userId) {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = await Cart.create({ user: userId, items: [] });
  }
  return cart;
}

async function addToCart(req, res, next) {
  try {
    const productId = String(req.body.productId || req.body.product || "").trim();
    const qty = Math.max(1, Math.floor(Number(req.body.quantity) || 1));

    if (!isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product id." });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    if (product.stock < 1) {
      return res.status(400).json({ success: false, message: "Product is out of stock." });
    }

    const cart = await getOrCreateCart(req.user._id);
    const idx = cart.items.findIndex((line) => String(line.product) === productId);

    if (idx >= 0) {
      const nextQty = cart.items[idx].quantity + qty;
      if (nextQty > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} in stock.`,
        });
      }
      cart.items[idx].quantity = nextQty;
      cart.items[idx].price = product.price;
    } else {
      if (qty > product.stock) {
        return res.status(400).json({
          success: false,
          message: `Only ${product.stock} in stock.`,
        });
      }
      cart.items.push({
        product: productId,
        quantity: qty,
        price: product.price,
      });
    }

    await cart.save();
    await cart.populate({
      path: "items.product",
      select: "name price description image stock category",
    });

    const { totalPrice, itemCount } = computeTotals(cart.items);
    res.status(200).json({
      success: true,
      message: "Cart updated.",
      cart: cart.toObject(),
      totalPrice,
      itemCount,
    });
  } catch (error) {
    next(error);
  }
}

async function getCart(req, res, next) {
  try {
    const cart = await getOrCreateCart(req.user._id);
    await cart.populate({
      path: "items.product",
      select: "name price description image stock category",
    });

    const { totalPrice, itemCount } = computeTotals(cart.items);
    res.status(200).json({
      success: true,
      cart: cart.toObject(),
      totalPrice,
      itemCount,
    });
  } catch (error) {
    next(error);
  }
}

async function updateCartQuantity(req, res, next) {
  try {
    const productId = String(req.params.productId || "").trim();
    const quantity = Math.floor(Number(req.body.quantity));

    if (!isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product id." });
    }
    if (!Number.isFinite(quantity) || quantity < 1) {
      return res.status(400).json({ success: false, message: "Quantity must be at least 1." });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    const cart = await getOrCreateCart(req.user._id);
    const idx = cart.items.findIndex((line) => String(line.product) === productId);
    if (idx < 0) {
      return res.status(404).json({ success: false, message: "Item not in cart." });
    }

    if (quantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Only ${product.stock} in stock.`,
      });
    }

    cart.items[idx].quantity = quantity;
    cart.items[idx].price = product.price;
    await cart.save();

    await cart.populate({
      path: "items.product",
      select: "name price description image stock category",
    });

    const { totalPrice, itemCount } = computeTotals(cart.items);
    res.status(200).json({
      success: true,
      message: "Quantity updated.",
      cart: cart.toObject(),
      totalPrice,
      itemCount,
    });
  } catch (error) {
    next(error);
  }
}

async function removeFromCart(req, res, next) {
  try {
    const productId = String(req.params.productId || "").trim();
    if (!isValidObjectId(productId)) {
      return res.status(400).json({ success: false, message: "Invalid product id." });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found." });
    }

    const before = cart.items.length;
    cart.items = cart.items.filter((line) => String(line.product) !== productId);
    if (cart.items.length === before) {
      return res.status(404).json({ success: false, message: "Item not in cart." });
    }

    await cart.save();
    await cart.populate({
      path: "items.product",
      select: "name price description image stock category",
    });

    const { totalPrice, itemCount } = computeTotals(cart.items);
    res.status(200).json({
      success: true,
      message: "Item removed.",
      cart: cart.toObject(),
      totalPrice,
      itemCount,
    });
  } catch (error) {
    next(error);
  }
}

async function clearCart(req, res, next) {
  try {
    const cart = await getOrCreateCart(req.user._id);
    cart.items = [];
    await cart.save();

    res.status(200).json({
      success: true,
      message: "Cart cleared.",
      cart: cart.toObject(),
      totalPrice: 0,
      itemCount: 0,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  addToCart,
  clearCart,
  getCart,
  removeFromCart,
  updateCartQuantity,
};
