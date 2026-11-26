const mysql = require("mysql2/promise");
const { loadEnv } = require("./load-env");

// CLEARLY FAKE sample data so the store has something to render.
// Every product name starts with "SAMPLE", prices are made up, and media URLs
// point at sample:// placeholders. Safe to re-run: rows are upserted by slug.

const categories = [
  { name: "Rings", slug: "rings", sort_order: 1 },
  { name: "Bracelets", slug: "bracelets", sort_order: 2 },
  { name: "Necklaces", slug: "necklaces", sort_order: 3 },
];

const settings = [
  { setting_key: "delivery_fee", setting_value: "200" },
  { setting_key: "discount_threshold", setting_value: "5000" },
  { setting_key: "discount_percent", setting_value: "10" },
  { setting_key: "payment_hold_hours", setting_value: "24" },
];

const drops = [
  {
    name: "SAMPLE - First Drop",
    slug: "sample-first-drop",
    status: "active",
    release_at: null,
  },
];

const products = [
  {
    name: "SAMPLE - Bone Signet Ring",
    slug: "sample-bone-signet-ring",
    category: "rings",
    price: 850,
    compare_at_price: 1000,
    stock: 8,
    availability: "available",
    restockable: true,
    is_best_seller: true,
    is_new_drop: false,
    is_exclusive: false,
    length_label: "SAMPLE size 9",
    scatter_x: 24,
    scatter_y: 12,
    rotation: -6,
    show_on_home: 1,
    home_x: 22,
    home_y: 16,
    home_rot: -6,
  },
  {
    name: "SAMPLE - Thorn Band Ring",
    slug: "sample-thorn-band-ring",
    category: "rings",
    price: 950,
    compare_at_price: null,
    stock: 5,
    availability: "available",
    restockable: true,
    is_best_seller: false,
    is_new_drop: true,
    is_exclusive: false,
    drop: "sample-first-drop",
    length_label: "SAMPLE size 11",
    scatter_x: 76,
    scatter_y: 20,
    rotation: 5,
    show_on_home: 1,
    home_x: 68,
    home_y: 20,
    home_rot: 5,
  },
  {
    name: "SAMPLE - Oath Chain Bracelet",
    slug: "sample-oath-chain-bracelet",
    category: "bracelets",
    price: 1600,
    compare_at_price: null,
    stock: 10,
    availability: "available",
    restockable: true,
    is_best_seller: true,
    is_new_drop: false,
    is_exclusive: false,
    length_label: "SAMPLE 20 cm",
    scatter_x: 20,
    scatter_y: 43,
    rotation: 4,
    show_on_home: 1,
    home_x: 24,
    home_y: 43,
    home_rot: 4,
  },
  {
    name: "SAMPLE - Widow's Web Bracelet",
    slug: "sample-widows-web-bracelet",
    category: "bracelets",
    price: 1750,
    compare_at_price: 2000,
    stock: 6,
    availability: "available",
    restockable: true,
    is_best_seller: false,
    is_new_drop: true,
    is_exclusive: false,
    drop: "sample-first-drop",
    length_label: "SAMPLE 19 cm",
    scatter_x: 80,
    scatter_y: 47,
    rotation: -5,
    show_on_home: 1,
    home_x: 68,
    home_y: 47,
    home_rot: -5,
  },
  {
    name: "SAMPLE - Reliquary Pendant",
    slug: "sample-reliquary-pendant",
    category: "necklaces",
    price: 1900,
    compare_at_price: null,
    stock: 4,
    availability: "exclusive",
    restockable: false,
    is_best_seller: false,
    is_new_drop: false,
    is_exclusive: true,
    drop: "sample-first-drop",
    length_label: "SAMPLE 18 inch",
    scatter_x: 26,
    scatter_y: 70,
    rotation: -4,
    show_on_home: 1,
    home_x: 20,
    home_y: 70,
    home_rot: -4,
  },
  {
    name: "SAMPLE - Hollow Cross Necklace",
    slug: "sample-hollow-cross-necklace",
    category: "necklaces",
    price: 2100,
    compare_at_price: null,
    stock: 3,
    availability: "exclusive",
    restockable: false,
    is_best_seller: false,
    is_new_drop: true,
    is_exclusive: true,
    drop: "sample-first-drop",
    length_label: "SAMPLE 20 inch",
    scatter_x: 74,
    scatter_y: 74,
    rotation: 6,
    show_on_home: 1,
    home_x: 66,
    home_y: 74,
    home_rot: 6,
  },
  {
    name: "SAMPLE - Grave Dirt Ring",
    slug: "sample-grave-dirt-ring",
    category: "rings",
    price: 700,
    compare_at_price: null,
    stock: 12,
    availability: "available",
    restockable: true,
    is_best_seller: false,
    is_new_drop: false,
    is_exclusive: false,
    length_label: "SAMPLE size 7",
    scatter_x: 30,
    scatter_y: 88,
    rotation: 3,
    show_on_home: 0,
    home_x: 24,
    home_y: 85,
    home_rot: 3,
  },
  {
    name: "SAMPLE - Mourning Chain Necklace",
    slug: "sample-mourning-chain-necklace",
    category: "necklaces",
    price: 1500,
    compare_at_price: null,
    stock: 0,
    availability: "sold_out",
    restockable: true,
    is_best_seller: false,
    is_new_drop: false,
    is_exclusive: false,
    length_label: "SAMPLE 22 inch",
    scatter_x: 70,
    scatter_y: 92,
    rotation: -7,
    show_on_home: 0,
    home_x: 71,
    home_y: 86,
    home_rot: -7,
  },
];

function mediaFor(slug) {
  return JSON.stringify([
    { url: `sample://${slug}`, alt: "SAMPLE placeholder image", type: "image" },
  ]);
}

async function seed(conn) {
  await conn.beginTransaction();
  try {
    for (const c of categories) {
      await conn.execute(
        "INSERT INTO categories (name, slug, sort_order) VALUES (?, ?, ?) " +
          "ON DUPLICATE KEY UPDATE name = VALUES(name), sort_order = VALUES(sort_order)",
        [c.name, c.slug, c.sort_order],
      );
    }

    for (const s of settings) {
      await conn.execute(
        "INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) " +
          "ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)",
        [s.setting_key, s.setting_value],
      );
    }

    for (const d of drops) {
      await conn.execute(
        "INSERT INTO drops (name, slug, status, release_at) VALUES (?, ?, ?, ?) " +
          "ON DUPLICATE KEY UPDATE name = VALUES(name), status = VALUES(status)",
        [d.name, d.slug, d.status, d.release_at],
      );
    }

    const [catRows] = await conn.query("SELECT id, slug FROM categories");
    const catMap = new Map(catRows.map((r) => [r.slug, r.id]));
    const [dropRows] = await conn.query("SELECT id, slug FROM drops");
    const dropMap = new Map(dropRows.map((r) => [r.slug, r.id]));

    for (const p of products) {
      const categoryId = p.category ? catMap.get(p.category) ?? null : null;
      const dropId = p.drop ? dropMap.get(p.drop) ?? null : null;
      await conn.execute(
        "INSERT INTO products (" +
          "name, slug, description, price, compare_at_price, category_id, drop_id, " +
          "stock, availability, restockable, is_best_seller, is_new_drop, is_exclusive, " +
          "material, length_label, build_details, media, scatter_x, scatter_y, rotation, " +
          "show_on_home, home_x, home_y, home_rot" +
          ") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) " +
          "ON DUPLICATE KEY UPDATE " +
          "name = VALUES(name), price = VALUES(price), compare_at_price = VALUES(compare_at_price), " +
          "category_id = VALUES(category_id), drop_id = VALUES(drop_id), stock = VALUES(stock), " +
          "availability = VALUES(availability), restockable = VALUES(restockable), " +
          "is_best_seller = VALUES(is_best_seller), is_new_drop = VALUES(is_new_drop), " +
          "is_exclusive = VALUES(is_exclusive), material = VALUES(material), " +
          "length_label = VALUES(length_label), build_details = VALUES(build_details), " +
          "media = VALUES(media), scatter_x = VALUES(scatter_x), scatter_y = VALUES(scatter_y), " +
          "rotation = VALUES(rotation), show_on_home = VALUES(show_on_home), " +
          "home_x = VALUES(home_x), home_y = VALUES(home_y), home_rot = VALUES(home_rot)",
        [
          p.name,
          p.slug,
          "SAMPLE product for layout testing. Not a real item.",
          p.price,
          p.compare_at_price,
          categoryId,
          dropId,
          p.stock,
          p.availability,
          p.restockable ? 1 : 0,
          p.is_best_seller ? 1 : 0,
          p.is_new_drop ? 1 : 0,
          p.is_exclusive ? 1 : 0,
          "SAMPLE material (not real)",
          p.length_label,
          "SAMPLE construction detail.",
          mediaFor(p.slug),
          p.scatter_x,
          p.scatter_y,
          p.rotation,
          p.show_on_home,
          p.home_x,
          p.home_y,
          p.home_rot,
        ],
      );
    }

    await conn.execute(
      "INSERT INTO discount_codes (code, type, value, min_subtotal, active) " +
        "VALUES (?, 'percentage', 10, 0, 1) " +
        "ON DUPLICATE KEY UPDATE value = VALUES(value), active = VALUES(active)",
      ["SAMPLE10"],
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  }
}

async function main() {
  loadEnv();
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env first.");
  }
  const conn = await mysql.createConnection({ uri: process.env.DATABASE_URL });
  try {
    await seed(conn);
    console.log(
      `seed complete - ${products.length} clearly fake SAMPLE products inserted`,
    );
  } finally {
    await conn.end();
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});