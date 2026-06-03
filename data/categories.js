/**
 * Single source of truth for marketplace categories (main + sub).
 * Slugs are stable IDs used on products and in URLs.
 */
const CATEGORY_TREE = [
  {
    name: "Clothing & Fashion",
    slug: "clothing-fashion",
    icon: "shirt",
    subcategories: [
      { name: "Men's Clothing", slug: "mens-clothing" },
      { name: "Women's Clothing", slug: "womens-clothing" },
      { name: "Kids Clothing", slug: "kids-clothing" },
      { name: "Shoes", slug: "shoes" },
      { name: "Watches", slug: "watches" },
      { name: "Accessories", slug: "accessories" },
    ],
  },
  {
    name: "Electronics",
    slug: "electronics",
    icon: "smartphone",
    subcategories: [
      { name: "Mobile Phones", slug: "mobile-phones" },
      { name: "Laptops", slug: "laptops" },
      { name: "Tablets", slug: "tablets" },
      { name: "Headphones & Earbuds", slug: "headphones-earbuds" },
      { name: "Smart Watches", slug: "smart-watches" },
      { name: "Gaming Consoles", slug: "gaming-consoles" },
      { name: "Computer Accessories", slug: "computer-accessories" },
    ],
  },
  {
    name: "Home & Living",
    slug: "home-living",
    icon: "home",
    subcategories: [
      { name: "Furniture", slug: "furniture" },
      { name: "Home Decor", slug: "home-decor" },
      { name: "Kitchen Appliances", slug: "kitchen-appliances" },
      { name: "Lighting", slug: "lighting" },
      { name: "Storage & Organization", slug: "storage-organization" },
    ],
  },
  {
    name: "Beauty & Personal Care",
    slug: "beauty-personal-care",
    icon: "sparkles",
    subcategories: [
      { name: "Skincare", slug: "skincare" },
      { name: "Haircare", slug: "haircare" },
      { name: "Makeup", slug: "makeup" },
      { name: "Fragrances", slug: "fragrances" },
      { name: "Grooming Tools", slug: "grooming-tools" },
    ],
  },
  {
    name: "Grocery & Food",
    slug: "grocery-food",
    icon: "shopping-basket",
    subcategories: [
      { name: "Packaged Food", slug: "packaged-food" },
      { name: "Beverages", slug: "beverages" },
      { name: "Snacks", slug: "snacks" },
      { name: "Fresh Items", slug: "fresh-items" },
    ],
  },
  {
    name: "Sports & Fitness",
    slug: "sports-fitness",
    icon: "dumbbell",
    subcategories: [
      { name: "Fitness Equipment", slug: "fitness-equipment" },
      { name: "Sports Wear", slug: "sports-wear" },
      { name: "Supplements", slug: "supplements" },
      { name: "Outdoor Gear", slug: "outdoor-gear" },
    ],
  },
  {
    name: "Books & Education",
    slug: "books-education",
    icon: "book-open",
    subcategories: [
      { name: "Books", slug: "books" },
      { name: "Stationery", slug: "stationery" },
      { name: "Courses / Learning Material", slug: "courses-learning" },
    ],
  },
  {
    name: "Kids & Toys",
    slug: "kids-toys",
    icon: "baby",
    subcategories: [
      { name: "Toys", slug: "toys" },
      { name: "Baby Products", slug: "baby-products" },
      { name: "School Supplies", slug: "school-supplies" },
    ],
  },
];

function flattenCategories() {
  const flat = [];
  for (const main of CATEGORY_TREE) {
    flat.push({
      name: main.name,
      slug: main.slug,
      icon: main.icon,
      isMain: true,
      parentSlug: null,
      parentName: null,
    });
    for (const sub of main.subcategories) {
      flat.push({
        name: sub.name,
        slug: sub.slug,
        icon: main.icon,
        isMain: false,
        parentSlug: main.slug,
        parentName: main.name,
      });
    }
  }
  return flat;
}

function findSubcategory(mainSlug, subSlug) {
  const main = CATEGORY_TREE.find((c) => c.slug === mainSlug);
  if (!main) return null;
  const sub = main.subcategories.find((s) => s.slug === subSlug);
  if (!sub) return null;
  return {
    mainCategory: main.slug,
    mainCategoryName: main.name,
    subCategory: sub.slug,
    subCategoryName: sub.name,
    category: sub.name,
  };
}

function isValidCategoryPair(mainSlug, subSlug) {
  return Boolean(findSubcategory(mainSlug, subSlug));
}

module.exports = {
  CATEGORY_TREE,
  flattenCategories,
  findSubcategory,
  isValidCategoryPair,
};
