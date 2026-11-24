import { connection } from "next/server";
import { query } from "@/lib/db";
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

// Products flagged for the homepage scatter field, in a stable id order. Read
// per request (like settings) so owner edits show up without a rebuild, and
// wrapped so an unreachable database degrades to an empty field instead of
// crashing the page.
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