import { apiRequest } from "./api";
import {
  Baby,
  BookOpen,
  Dumbbell,
  Home,
  Shirt,
  ShoppingBasket,
  Smartphone,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type Subcategory = { name: string; slug: string };
export type CategoryTreeItem = {
  name: string;
  slug: string;
  icon: string;
  subcategories: Subcategory[];
};

export type ApiProduct = {
  _id: string;
  name: string;
  price: number;
  description?: string;
  image?: string;
  images?: string[];
  stock: number;
  mainCategory?: string;
  subCategory?: string;
  category: string;
};

const ICON_MAP: Record<string, LucideIcon> = {
  shirt: Shirt,
  smartphone: Smartphone,
  home: Home,
  sparkles: Sparkles,
  "shopping-basket": ShoppingBasket,
  dumbbell: Dumbbell,
  "book-open": BookOpen,
  baby: Baby,
};

const CATEGORY_COLORS: Record<string, string> = {
  "clothing-fashion": "bg-pink-100",
  electronics: "bg-blue-100",
  "home-living": "bg-orange-100",
  "beauty-personal-care": "bg-rose-100",
  "grocery-food": "bg-green-100",
  "sports-fitness": "bg-red-100",
  "books-education": "bg-yellow-100",
  "kids-toys": "bg-purple-100",
};

export function getCategoryIcon(iconKey: string): LucideIcon {
  return ICON_MAP[iconKey] || Shirt;
}

export function getCategoryColor(slug: string): string {
  return CATEGORY_COLORS[slug] || "bg-gray-100";
}

export async function fetchCategoryTree(): Promise<CategoryTreeItem[]> {
  const data = await apiRequest<{ categories: CategoryTreeItem[] }>("/categories", {
    method: "GET",
    auth: false,
  });
  return data.categories ?? [];
}

export function findMainCategory(tree: CategoryTreeItem[], slug: string) {
  return tree.find((c) => c.slug === slug);
}

export function shuffleProducts<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function groupProductsByMainCategory(products: ApiProduct[], tree: CategoryTreeItem[]) {
  const assignedIds = new Set<string>();

  const sections = tree
    .map((main) => {
      const matched = products.filter((p) => {
        if (p.mainCategory === main.slug) {
          assignedIds.add(p._id);
          return true;
        }
        return false;
      });
      return { main, products: matched };
    })
    .filter((section) => section.products.length > 0);

  for (const product of products) {
    if (assignedIds.has(product._id) || product.mainCategory) continue;
    const label = (product.category || "").trim().toLowerCase();
    if (!label) continue;

    for (const main of tree) {
      const sub = main.subcategories.find((s) => s.name.toLowerCase() === label);
      if (!sub) continue;
      assignedIds.add(product._id);
      let section = sections.find((s) => s.main.slug === main.slug);
      if (!section) {
        section = { main, products: [] };
        sections.push(section);
      }
      section.products.push({
        ...product,
        mainCategory: main.slug,
        subCategory: sub.slug,
      });
      break;
    }
  }

  return sections;
}
