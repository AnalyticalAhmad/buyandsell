const Category = require("../models/Category");
const { CATEGORY_TREE } = require("../data/categories");

async function getCategories(req, res, next) {
  try {
    const dbCategories = await Category.find().sort({ isMain: -1, name: 1 }).lean();

    if (dbCategories.length === 0) {
      return res.status(200).json({
        success: true,
        categories: CATEGORY_TREE,
        source: "static",
      });
    }

    const mains = dbCategories.filter((c) => c.isMain);
    const tree = mains.map((main) => ({
      name: main.name,
      slug: main.slug,
      icon: main.icon,
      subcategories: dbCategories
        .filter((c) => c.parentSlug === main.slug && !c.isMain)
        .map((sub) => ({ name: sub.name, slug: sub.slug })),
    }));

    res.status(200).json({
      success: true,
      categories: tree,
      source: "database",
      total: dbCategories.length,
      expected: CATEGORY_TREE.reduce((n, m) => n + 1 + m.subcategories.length, 0),
    });
  } catch (error) {
    next(error);
  }
}

module.exports = { getCategories };
