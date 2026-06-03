const Category = require("../models/Category");
const { CATEGORY_TREE, flattenCategories } = require("../data/categories");

const EXPECTED_COUNT = flattenCategories().length;

async function seedCategories() {
  let upserted = 0;

  for (const main of CATEGORY_TREE) {
    const mainDoc = await Category.findOneAndUpdate(
      { slug: main.slug },
      {
        $set: {
          name: main.name,
          slug: main.slug,
          icon: main.icon,
          isMain: true,
          parent: null,
          parentSlug: null,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    upserted += 1;

    for (const sub of main.subcategories) {
      await Category.findOneAndUpdate(
        { slug: sub.slug },
        {
          $set: {
            name: sub.name,
            slug: sub.slug,
            icon: main.icon,
            isMain: false,
            parent: mainDoc._id,
            parentSlug: main.slug,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      upserted += 1;
    }
  }

  const count = await Category.countDocuments();
  console.log(`Categories synced: ${count} in database (${EXPECTED_COUNT} expected).`);

  if (count < EXPECTED_COUNT) {
    console.warn(
      "Category count is lower than expected. Check server logs for duplicate-key errors."
    );
  }
}

module.exports = { seedCategories };
