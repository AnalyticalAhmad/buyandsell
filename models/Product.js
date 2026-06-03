const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [200, "Name cannot exceed 200 characters"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },
    images: {
      type: [String],
      default: [],
    },
    image: {
      type: String,
      trim: true,
      default: "",
    },
    stock: {
      type: Number,
      required: [true, "Stock is required"],
      min: [0, "Stock cannot be negative"],
      validate: {
        validator: Number.isInteger,
        message: "Stock must be a whole number",
      },
    },
    mainCategory: {
      type: String,
      trim: true,
      index: true,
      default: "",
    },
    subCategory: {
      type: String,
      trim: true,
      index: true,
      default: "",
    },
    /** Display label (subcategory name), kept for backward compatibility */
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
      maxlength: [120, "Category cannot exceed 120 characters"],
    },
  },
  { timestamps: true }
);

productSchema.pre("save", function syncPrimaryImage() {
  if (Array.isArray(this.images) && this.images.length > 0) {
    this.image = this.images[0];
  } else if (!this.image && this.images?.length === 0) {
    this.image = "";
  }
});

module.exports = mongoose.models.Product || mongoose.model("Product", productSchema);
