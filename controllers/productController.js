const mongoose = require("mongoose");
const Product = require("../models/Product");
const { findSubcategory, isValidCategoryPair } = require("../data/categories");

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

function normalizeImages(body) {
  const fromArray = Array.isArray(body.images)
    ? body.images.map((url) => String(url).trim()).filter(Boolean)
    : [];
  const single = body.image != null ? String(body.image).trim() : "";
  if (fromArray.length) return fromArray;
  if (single) return [single];
  return [];
}

function resolveCategoryFields(body) {
  const mainCategory = String(body.mainCategory || "").trim();
  const subCategory = String(body.subCategory || "").trim();

  if (mainCategory && subCategory) {
    const resolved = findSubcategory(mainCategory, subCategory);
    if (!resolved) {
      const err = new Error("Invalid main and sub category combination.");
      err.statusCode = 400;
      throw err;
    }
    return resolved;
  }

  const err = new Error("Main category and sub category are required.");
  err.statusCode = 400;
  throw err;
}

function buildProductFilter(query) {
  const filter = {};
  const main = query.main || query.mainCategory;
  const sub = query.sub || query.subCategory;
  const legacy = query.category;

  if (main && String(main).trim()) {
    filter.mainCategory = String(main).trim();
  }
  if (sub && String(sub).trim()) {
    filter.subCategory = String(sub).trim();
  }
  if (!filter.mainCategory && !filter.subCategory && legacy && String(legacy).trim()) {
    const value = String(legacy).trim();
    filter.$or = [
      { mainCategory: value },
      { subCategory: value },
      { category: new RegExp(`^${value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
    ];
  }

  if (query.exclude && String(query.exclude).trim() && isValidObjectId(String(query.exclude).trim())) {
    filter._id = { $ne: String(query.exclude).trim() };
  }

  return filter;
}

function shuffleArray(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function createProduct(req, res, next) {
  try {
    const { name, price, description, stock } = req.body;
    const images = normalizeImages(req.body);
    const cat = resolveCategoryFields(req.body);

    const product = await Product.create({
      name: String(name || "").trim(),
      price: Number(price),
      description: description != null ? String(description).trim() : "",
      images,
      image: images[0] || "",
      stock: Number(stock),
      mainCategory: cat.mainCategory,
      subCategory: cat.subCategory,
      category: cat.category,
    });

    res.status(201).json({ success: true, message: "Product created.", product });
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
}

async function getProducts(req, res, next) {
  try {
    const filter = buildProductFilter(req.query);
    let products = await Product.find(filter).sort({ createdAt: -1 }).lean();

    if (req.query.shuffle === "true" || req.query.random === "true") {
      products = shuffleArray(products);
    }

    res.status(200).json({ success: true, count: products.length, products });
  } catch (error) {
    next(error);
  }
}

async function getProductById(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    res.status(200).json({ success: true, product });
  } catch (error) {
    next(error);
  }
}

async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    const updates = {};
    if (req.body.name !== undefined) updates.name = String(req.body.name).trim();
    if (req.body.price !== undefined) updates.price = Number(req.body.price);
    if (req.body.description !== undefined) updates.description = String(req.body.description).trim();
    if (req.body.stock !== undefined) updates.stock = Number(req.body.stock);
    if (
      req.body.mainCategory !== undefined ||
      req.body.subCategory !== undefined ||
      req.body.category !== undefined
    ) {
      const cat = resolveCategoryFields(req.body);
      updates.mainCategory = cat.mainCategory;
      updates.subCategory = cat.subCategory;
      updates.category = cat.category;
    }
    if (req.body.images !== undefined || req.body.image !== undefined) {
      const images = normalizeImages(req.body);
      updates.images = images;
      updates.image = images[0] || "";
    }

    const product = await Product.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    res.status(200).json({ success: true, message: "Product updated.", product });
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    res.status(200).json({ success: true, message: "Product deleted." });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  updateProduct,
  isValidCategoryPair,
};
