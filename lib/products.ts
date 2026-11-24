import { connection } from "next/server";
import { query, withTransaction } from "@/lib/db";
import type { PoolConnection } from "@/lib/db";
import type { HomeProduct } from "@/lib/scatter";

type ProductRow = {
  id: number;
  name: string;
  slug: string;
  price: number;
  home_x: string;
  home_y: string;
  home_rot: string;
};

export type ProductMedia = {
  url: string;
  alt?: string;
  type?: "image" | "video";
};

export type Product = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compareAtPrice: number | null;
  categoryId: number | null;
  categoryName: string | null;
  categorySlug: string | null;
  dropId: number | null;
  stock: number;
  availability: string;
  material: string | null;
  lengthLabel: string | null;
  buildDetails: string | null;
  media: ProductMedia[];
  isBestSeller: boolean;
  isNewDrop: boolean;
  isExclusive: boolean;
};

export type ProductFilters = {
  categorySlug?: string;
  bestSeller?: boolean;
  newDrop?: boolean;
  exclusive?: boolean;
  onSale?: boolean;
};

type ProductListRow = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  compare_at_price: number | null;
  category_id: number | null;
  category_name: string | null;
  category_slug: string | null;
  drop_id: number | null;
  stock: number;
  availability: string;
  material: string | null;
  length_label: string | null;
  build_details: string | null;
  media: unknown;
  is_best_seller: number | boolean;
  is_new_drop: number | boolean;
  is_exclusive: number | boolean;
};

function parseMedia(raw: unknown): ProductMedia[] {
  if (raw == null) return [];
  let value: unknown = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(value)) return [];
  return value
    .map((m) => {
      if (!m || typeof m !== "object") return null;
      const o = m as Record<string, unknown>;
      const url = typeof o.url === "string" ? o.url : "";
      if (!url) return null;
      return {
        url,
        alt: typeof o.alt === "string" ? o.alt : undefined,
        type: o.type === "video" ? "video" : "image",
      } as ProductMedia;
    })
    .filter((m): m is ProductMedia => m !== null);
}

function toBool(v: number | boolean): boolean {
  return v === true || v === 1;
}

export async function getAllProducts(filters: ProductFilters = {}): Promise<Product[]> {
  await connection();

  try {
    const params: (string | null)[] = [];
    let sql =
      "SELECT p.id, p.name, p.slug, p.description, p.price, p.compare_at_price, " +
      "p.category_id, c.name AS category_name, c.slug AS category_slug, " +
      "p.drop_id, p.stock, p.availability, p.material, p.length_label, " +
      "p.build_details, p.media, p.is_best_seller, p.is_new_drop, p.is_exclusive " +
      "FROM products p LEFT JOIN categories c ON c.id = p.category_id " +
      "WHERE p.availability <> 'archived'";

    if (filters.categorySlug) {
      sql += " AND c.slug = ?";
      params.push(filters.categorySlug);
    }
    if (filters.bestSeller) {
      sql += " AND p.is_best_seller = 1";
    }
    if (filters.newDrop) {
      sql += " AND p.is_new_drop = 1";
    }
    if (filters.exclusive) {
      sql += " AND p.is_exclusive = 1";
    }
    if (filters.onSale) {
      sql += " AND p.compare_at_price IS NOT NULL AND p.compare_at_price > p.price";
    }
    sql += " ORDER BY p.id";

    const rows = await query<ProductListRow>(sql, params);

    return rows.map((r) => ({
      id: Number(r.id),
      name: r.name,
      slug: r.slug,
      description: r.description,
      price: Number(r.price),
      compareAtPrice:
        r.compare_at_price == null ? null : Number(r.compare_at_price),
      categoryId: r.category_id == null ? null : Number(r.category_id),
      categoryName: r.category_name,
      categorySlug: r.category_slug,
      dropId: r.drop_id == null ? null : Number(r.drop_id),
      stock: Number(r.stock),
      availability: r.availability,
      material: r.material,
      lengthLabel: r.length_label,
      buildDetails: r.build_details,
      media: parseMedia(r.media),
      isBestSeller: toBool(r.is_best_seller),
      isNewDrop: toBool(r.is_new_drop),
      isExclusive: toBool(r.is_exclusive),
    }));
  } catch {
    return [];
  }
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  await connection();

  try {
    const rows = await query<ProductListRow>(
      "SELECT p.id, p.name, p.slug, p.description, p.price, p.compare_at_price, " +
        "p.category_id, c.name AS category_name, c.slug AS category_slug, " +
        "p.drop_id, p.stock, p.availability, p.material, p.length_label, " +
        "p.build_details, p.media, p.is_best_seller, p.is_new_drop, p.is_exclusive " +
        "FROM products p LEFT JOIN categories c ON c.id = p.category_id " +
        "WHERE p.slug = ? LIMIT 1",
      [slug],
    );
    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      id: Number(r.id),
      name: r.name,
      slug: r.slug,
      description: r.description,
      price: Number(r.price),
      compareAtPrice:
        r.compare_at_price == null ? null : Number(r.compare_at_price),
      categoryId: r.category_id == null ? null : Number(r.category_id),
      categoryName: r.category_name,
      categorySlug: r.category_slug,
      dropId: r.drop_id == null ? null : Number(r.drop_id),
      stock: Number(r.stock),
      availability: r.availability,
      material: r.material,
      lengthLabel: r.length_label,
      buildDetails: r.build_details,
      media: parseMedia(r.media),
      isBestSeller: toBool(r.is_best_seller),
      isNewDrop: toBool(r.is_new_drop),
      isExclusive: toBool(r.is_exclusive),
    };
  } catch {
    return null;
  }
}

export async function searchProducts(q: string): Promise<Product[]> {
  await connection();

  try {
    const term = `%${q}%`;
    const rows = await query<ProductListRow>(
      "SELECT p.id, p.name, p.slug, p.description, p.price, p.compare_at_price, " +
        "p.category_id, c.name AS category_name, c.slug AS category_slug, " +
        "p.drop_id, p.stock, p.availability, p.material, p.length_label, " +
        "p.build_details, p.media, p.is_best_seller, p.is_new_drop, p.is_exclusive " +
        "FROM products p LEFT JOIN categories c ON c.id = p.category_id " +
        "WHERE p.availability <> 'archived' AND (" +
        "p.name LIKE ? OR p.description LIKE ? OR p.material LIKE ? OR " +
        "p.length_label LIKE ? OR c.name LIKE ?) " +
        "ORDER BY p.id",
      [term, term, term, term, term],
    );

    return rows.map((r) => ({
      id: Number(r.id),
      name: r.name,
      slug: r.slug,
      description: r.description,
      price: Number(r.price),
      compareAtPrice:
        r.compare_at_price == null ? null : Number(r.compare_at_price),
      categoryId: r.category_id == null ? null : Number(r.category_id),
      categoryName: r.category_name,
      categorySlug: r.category_slug,
      dropId: r.drop_id == null ? null : Number(r.drop_id),
      stock: Number(r.stock),
      availability: r.availability,
      material: r.material,
      lengthLabel: r.length_label,
      buildDetails: r.build_details,
      media: parseMedia(r.media),
      isBestSeller: toBool(r.is_best_seller),
      isNewDrop: toBool(r.is_new_drop),
      isExclusive: toBool(r.is_exclusive),
    }));
  } catch {
    return [];
  }
}

// Products flagged for the homepage scatter field, in a stable id order.
export async function getHomeProducts(): Promise<HomeProduct[]> {
  await connection();

  try {
    const rows = await query<ProductRow>(
      "SELECT id, name, slug, price, home_x, home_y, home_rot " +
        "FROM products WHERE show_on_home = 1 ORDER BY id",
    );

    return rows.map((r) => ({
      id: Number(r.id),
      name: r.name,
      slug: r.slug,
      price: Number(r.price),
      homeX: Number(r.home_x),
      homeY: Number(r.home_y),
      homeRot: Number(r.home_rot),
    }));
  } catch {
    return [];
  }
}