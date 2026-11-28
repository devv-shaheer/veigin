import { verifySession } from "@/lib/admin-auth";
import { query } from "@/lib/db";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { LOGIN_PATH } from "@/lib/admin-paths";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Storefront Settings · Admin Panel",
  description: "Configure announcement banner and featured products",
  robots: { index: false, follow: false },
};

type AnnouncementSettings = {
  enabled: boolean;
  message: string;
  background_color: string;
  text_color: string;
  link_url: string | null;
  link_text: string | null;
  dismissible: boolean;
};

type FeaturedProduct = {
  id: number;
  name: string;
  slug: string;
  price: number;
  stock: number;
  availability: string;
  media: string | null;
};

// Server Actions
async function updateAnnouncementAction(formData: FormData) {
  "use server";
  const session = await verifySession();
  if (!session) throw new Error("Unauthorized");

  const enabled = formData.get("enabled") === "on";
  const message = (formData.get("message") as string)?.trim();
  const backgroundColor = (formData.get("background_color") as string)?.trim() || "#8B0000";
  const textColor = (formData.get("text_color") as string)?.trim() || "#FFFFFF";
  const linkUrl = (formData.get("link_url") as string)?.trim() || null;
  const linkText = (formData.get("link_text") as string)?.trim() || null;
  const dismissible = formData.get("dismissible") === "on";

  if (enabled && !message) throw new Error("Message is required when banner is enabled.");

  // Store in settings table (using JSON for complex settings)
  const settings = {
    announcement_enabled: enabled,
    announcement_message: message,
    announcement_background_color: backgroundColor,
    announcement_text_color: textColor,
    announcement_link_url: linkUrl,
    announcement_link_text: linkText,
    announcement_dismissible: dismissible,
  };

  // We'll store each as individual settings keys for simplicity
  for (const [key, value] of Object.entries(settings)) {
    await query(
      `INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE setting_value = ?`,
      [key, String(value), String(value)]
    );
  }

  revalidatePath("/admin/storefront");
  revalidatePath("/");
  redirect("/admin/storefront?success=announcement");
}

async function updateFeaturedProductsAction(formData: FormData) {
  "use server";
  const session = await verifySession();
  if (!session) throw new Error("Unauthorized");

  const productIds = formData.getAll("featured_product_ids").map((v) => parseInt(v as string, 10)).filter((v) => !isNaN(v));

  // Store as JSON array
  await query(
    `INSERT INTO settings (setting_key, setting_value) VALUES ('featured_product_ids', ?)
     ON DUPLICATE KEY UPDATE setting_value = ?`,
    [JSON.stringify(productIds), JSON.stringify(productIds)]
  );

  revalidatePath("/admin/storefront");
  revalidatePath("/");
  redirect("/admin/storefront?success=featured");
}

async function getAnnouncementSettings(): Promise<AnnouncementSettings> {
  const rows = await query<{ setting_key: string; setting_value: string }>(
    "SELECT setting_key, setting_value FROM settings WHERE setting_key LIKE 'announcement_%'"
  );

  const settings: AnnouncementSettings = {
    enabled: false,
    message: "",
    background_color: "#8B0000",
    text_color: "#FFFFFF",
    link_url: null,
    link_text: null,
    dismissible: true,
  };

  for (const row of rows) {
    const key = row.setting_key.replace("announcement_", "") as keyof AnnouncementSettings;
    if (key in settings) {
      const value = row.setting_value;
      if (key === "enabled" || key === "dismissible") {
        (settings as any)[key] = value === "true";
      } else if (key === "link_url" || key === "link_text") {
        (settings as any)[key] = value === "null" ? null : value;
      } else {
        (settings as any)[key] = value;
      }
    }
  }

  return settings;
}

async function getFeaturedProductIds(): Promise<number[]> {
  const rows = await query<{ setting_value: string }>(
    "SELECT setting_value FROM settings WHERE setting_key = 'featured_product_ids' LIMIT 1"
  );
  if (!rows.length || !rows[0].setting_value) return [];
  try {
    return JSON.parse(rows[0].setting_value);
  } catch {
    return [];
  }
}

function firstImageUrl(media: string | null): string | null {
  if (!media) return null;
  try {
    const parsed = JSON.parse(media);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed[0]?.url ?? null;
    }
  } catch {
    return null;
  }
  return null;
}

async function getAvailableProducts(): Promise<FeaturedProduct[]> {
  return query<FeaturedProduct>(
    `SELECT id, name, slug, price, stock, availability, media
     FROM products
     WHERE availability = 'available' AND stock > 0
     ORDER BY name`
  );
}

export default async function AdminStorefrontPage({ searchParams }: { searchParams: Promise<{ success?: string }> }) {
  const session = await verifySession();
  if (!session) redirect(LOGIN_PATH);

  const params = await searchParams;
  const [announcement, featuredIds, availableProducts] = await Promise.all([
    getAnnouncementSettings(),
    getFeaturedProductIds(),
    getAvailableProducts(),
  ]);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Link href="/admin" className="text-[var(--admin-text-muted)] hover:text-[var(--admin-text)] text-sm">
              ← Overview
            </Link>
            <span className="text-[var(--admin-text-muted)]">/</span>
            <span className="text-sm font-medium" style={{ color: "var(--admin-crimson)" }}>Storefront</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-[var(--admin-text)] tracking-tight">Storefront Settings</h1>
          <p className="text-[var(--admin-text-muted)] text-sm mt-1">Configure the announcement banner and featured products on the homepage.</p>
        </div>
      </div>

      {/* Success Banner */}
      {(params.success === "announcement" || params.success === "featured") && (
        <div className="mb-6 admin-shell__card" style={{ backgroundColor: "var(--admin-emerald-subtle)", borderColor: "var(--admin-emerald-border)" }}>
          <span className="font-medium" style={{ color: "var(--admin-emerald)" }}>
            {params.success === "announcement" ? "Announcement banner updated successfully." : "Featured products updated successfully."}
          </span>
          <Link href="/admin/storefront" className="text-xs hover:underline" style={{ color: "var(--admin-emerald)" }}>Dismiss</Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Announcement Banner Section */}
        <section className="admin-shell__card">
          <h2 className="text-lg font-semibold text-[var(--admin-text)] mb-6">Announcement Banner</h2>
          <p className="text-sm mb-6" style={{ color: "var(--admin-text-muted)" }}>
            Display a persistent banner at the top of the storefront. Use for promotions, shipping notices, or important updates.
          </p>

          <form action={updateAnnouncementAction} className="space-y-5">
            <div>
              <label className="admin-shell__label flex items-center gap-3">
                <input
                  type="checkbox"
                  name="enabled"
                  defaultChecked={announcement.enabled}
                  className="admin-shell__checkbox"
                />
                <span className="text-sm text-[var(--admin-text)]">Enable announcement banner</span>
              </label>
            </div>

            <div>
              <label className="admin-shell__label">Message</label>
              <textarea
                name="message"
                defaultValue={announcement.message}
                placeholder="e.g., Free shipping on orders over PKR 5000! Use code SHIPFREE"
                className="admin-shell__input"
                rows={3}
                required={announcement.enabled}
              />
              <p className="admin-shell__hint">Supports basic HTML (links, bold, italic). Max 500 characters.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="admin-shell__label">Background Color</label>
                <input
                  type="color"
                  name="background_color"
                  defaultValue={announcement.background_color}
                  className="admin-shell__input"
                  style={{ height: "44px", padding: "2px" }}
                />
              </div>
              <div>
                <label className="admin-shell__label">Text Color</label>
                <input
                  type="color"
                  name="text_color"
                  defaultValue={announcement.text_color}
                  className="admin-shell__input"
                  style={{ height: "44px", padding: "2px" }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="admin-shell__label">Link URL (Optional)</label>
                <input
                  type="url"
                  name="link_url"
                  defaultValue={announcement.link_url || ""}
                  placeholder="https://example.com/promo"
                  className="admin-shell__input"
                />
              </div>
              <div>
                <label className="admin-shell__label">Link Text (Optional)</label>
                <input
                  type="text"
                  name="link_text"
                  defaultValue={announcement.link_text || ""}
                  placeholder="Shop Now"
                  className="admin-shell__input"
                />
              </div>
            </div>

            <div>
              <label className="admin-shell__label flex items-center gap-3">
                <input
                  type="checkbox"
                  name="dismissible"
                  defaultChecked={announcement.dismissible}
                  className="admin-shell__checkbox"
                />
                <span className="text-sm text-[var(--admin-text)]">Allow users to dismiss the banner (stores preference in localStorage)</span>
              </label>
            </div>

            {/* Preview */}
            {announcement.enabled && announcement.message && (
              <div className="pt-4 border-t" style={{ borderColor: "var(--admin-border)" }}>
                <h3 className="text-sm font-semibold text-[var(--admin-text)] mb-3">Preview</h3>
                <div
                  className="px-4 py-3 rounded text-center text-sm"
                  style={{
                    backgroundColor: announcement.background_color,
                    color: announcement.text_color,
                  }}
                >
                  <span dangerouslySetInnerHTML={{ __html: announcement.message }} />
                  {announcement.link_url && announcement.link_text && (
                    <a
                      href={announcement.link_url}
                      className="ml-3 underline hover:no-underline font-medium"
                      style={{ color: announcement.text_color }}
                    >
                      {announcement.link_text}
                    </a>
                  )}
                </div>
              </div>
            )}

            <button type="submit" className="admin-shell__btn admin-shell__btn--primary">
              Save Announcement Settings
            </button>
          </form>
        </section>

        {/* Featured Products Section */}
        <section className="admin-shell__card">
          <h2 className="text-lg font-semibold text-[var(--admin-text)] mb-6">Featured Products</h2>
          <p className="text-sm mb-6" style={{ color: "var(--admin-text-muted)" }}>
            Select up to 8 products to display on the homepage. These appear in the &apos;Featured&apos; section.
          </p>

          <form action={updateFeaturedProductsAction} className="space-y-5">
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {availableProducts.length === 0 ? (
                <p className="text-sm italic" style={{ color: "var(--admin-text-muted)" }}>
                  No available products found. Add products in the <Link href="/admin/products" className="underline hover:no-underline" style={{ color: "var(--admin-crimson)" }}>Products</Link> page.
                </p>
              ) : (
                availableProducts.map((product) => {
                  const isFeatured = featuredIds.includes(product.id);
                  const imageUrl = firstImageUrl(product.media);
                  return (
                    <label key={product.id} className="flex items-center gap-4 p-3 rounded transition-colors cursor-pointer" style={{
                      backgroundColor: isFeatured ? "var(--admin-crimson-subtle)" : "transparent",
                      borderColor: isFeatured ? "var(--admin-crimson-border)" : "var(--admin-border)",
                      borderWidth: "1px",
                      borderStyle: "solid",
                    }}>
                      <input
                        type="checkbox"
                        name="featured_product_ids"
                        value={product.id}
                        defaultChecked={isFeatured}
                        className="admin-shell__checkbox"
                      />
                      {firstImageUrl(product.media) && (
                        <img
                          src={firstImageUrl(product.media)!}
                          alt=""
                          className="w-12 h-12 object-cover rounded"
                          style={{ backgroundColor: "var(--admin-bg)" }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-[var(--admin-text)] truncate">{product.name}</div>
                        <div className="text-sm font-mono" style={{ color: "var(--admin-text-muted)" }}>
                          PKR {product.price.toLocaleString()} · Stock: {product.stock}
                        </div>
                      </div>
                      {isFeatured && (
                        <span className="admin-shell__badge admin-shell__badge--primary text-xs">Featured</span>
                      )}
                    </label>
                  );
                })
              )}
            </div>

            <div className="pt-4 border-t" style={{ borderColor: "var(--admin-border)" }}>
              <p className="text-sm mb-3" style={{ color: "var(--admin-text-muted)" }}>
                Currently featured: <span className="font-medium text-[var(--admin-text)]">{featuredIds.length}</span> / 8 products
              </p>
              <button type="submit" className="admin-shell__btn admin-shell__btn--primary" disabled={featuredIds.length >= 8}>
                {featuredIds.length >= 8 ? "Maximum (8) Selected" : "Save Featured Products"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}