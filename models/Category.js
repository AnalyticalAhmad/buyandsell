const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    icon: {
      type: String,
      trim: true,
      default: "",
    },
    isMain: {
      type: Boolean,
      default: false,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    parentSlug: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true }
);

categorySchema.index({ parentSlug: 1, isMain: 1 });

module.exports = mongoose.models.Category || mongoose.model("Category", categorySchema);
