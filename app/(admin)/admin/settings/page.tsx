import { verifySession } from "@/lib/admin-auth";
import { query } from "@/lib/db";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { LOGIN_PATH } from "@/lib/admin-paths";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Store Settings · Admin Panel",
  description: "Configure store information, business settings, shipping, and payment options",
  robots: { index: false, follow: false },
};

type SettingsGroup = {
  store_info: Record<string, string>;
  business: Record<string, string>;
  shipping: Record<string, string>;
  payment: Record<string, string>;
  display: Record<string, string>;
};

// Server Actions
async function updateSettingsAction(formData: FormData) {
  "use server";
  const session = await verifySession();
  if (!session) throw new Error("Unauthorized");

  const section = (formData.get("section") as string) || "store_info";
  const updates: Record<string, string> = {};

  for (const [key, value] of formData.entries()) {
    if (key !== "section") {
      updates[key] = value as string;
    }
  }

  for (const [key, value] of Object.entries(updates)) {
    await query(
      `INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
       ON DUPLICATE KEY UPDATE setting_value = ?`,
      [key, value, value]
    );
  }

  revalidatePath("/admin/settings");
  revalidatePath("/");
  redirect(`/admin/settings?success=${section}`);
}

async function getAllSettings(): Promise<SettingsGroup> {
  const rows = await query<{ setting_key: string; setting_value: string }>(
    "SELECT setting_key, setting_value FROM settings"
  );

  const defaults: SettingsGroup = {
    store_info: {
      store_name: "VEIGIN",
      store_tagline: "Premium Fashion & Lifestyle",
      store_email: "hello@veigin.com",
      store_phone: "+92 300 1234567",
      store_address: "123 Fashion Street, Karachi, Pakistan",
      store_currency: "PKR",
      store_timezone: "Asia/Karachi",
    },
    business: {
      tax_rate: "0",
      tax_inclusive: "false",
      order_prefix: "VG",
      order_start_number: "1000",
      low_stock_threshold: "5",
      auto_cancel_hours: "24",
    },
    shipping: {
      delivery_fee: "200",
      free_shipping_threshold: "5000",
      delivery_time_min: "2",
      delivery_time_max: "5",
      cod_available: "true",
      cod_fee: "100",
    },
    payment: {
      easypaisa_merchant_id: "",
      easypaisa_app_key: "",
      easypaisa_app_secret: "",
      bank_transfer_details: "Bank: HBL\nAccount: 00123456789001\nIBAN: PK36HABB000123456789001\nBeneficiary: VEIGIN",
      payment_hold_hours: "48",
      refund_policy_days: "14",
    },
    display: {
      products_per_page: "12",
      enable_reviews: "true",
      enable_wishlist: "true",
      show_compare_at_price: "true",
      default_sort: "newest",
    },
  };

  const result: SettingsGroup = { ...defaults };
  for (const row of rows) {
    const [section, ...keyParts] = row.setting_key.split("_");
    const key = keyParts.join("_");
    if (section in result && key in result[section as keyof SettingsGroup]) {
      (result[section as keyof SettingsGroup] as Record<string, string>)[key] = row.setting_value;
    }
  }

  return result;
}

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>;
}) {
  const session = await verifySession();
  if (!session) redirect(LOGIN_PATH);

  const params = await searchParams;
  const settings = await getAllSettings();

  const sectionTitles: Record<string, string> = {
    store_info: "Store Information",
    business: "Business Settings",
    shipping: "Shipping & Delivery",
    payment: "Payment Configuration",
    display: "Display & UX",
  };

  const sectionDescriptions: Record<string, string> = {
    store_info: "Basic store details shown to customers and used in communications.",
    business: "Core business configuration including tax, order numbering, and inventory thresholds.",
    shipping: "Delivery fees, free shipping thresholds, and cash on delivery settings.",
    payment: "Payment gateway credentials, bank details, and payment processing settings.",
    display: "Frontend display options including pagination, reviews, and sorting.",
  };

  const sectionIcons: Record<string, React.ReactNode> = {
    store_info: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
    business: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true"><path d="M21 12V7H5v6" /><path d="M3 18h18" /><path d="M5 7l3 6h10" /><path d="M17 21v-4" /><path d="M7 21v-4" /></svg>,
    shipping: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true"><path d="M22 8.5V18H2V8.5" /><path d="M12 18V12" /><path d="m16 10-4 4-4-4" /><path d="M5 16v6" /><path d="M19 16v6" /></svg>,
    payment: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2" /><path d="M2 8h20" /><path d="M10 12h4" /><path d="M10 16h4" /></svg>,
    display: <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden="true"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8" /><path d="M12 17v4" /></svg>,
  };

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
            <span className="text-sm font-medium" style={{ color: "var(--admin-crimson)" }}>Settings</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-semibold text-[var(--admin-text)] tracking-tight">Store Settings</h1>
          <p className="text-[var(--admin-text-muted)] text-sm mt-1">Configure your store information, business rules, shipping, payments, and display options.</p>
        </div>
      </div>

      {/* Success Banner */}
      {params.success && (
        <div className="mb-6 admin-shell__card" style={{ backgroundColor: "var(--admin-emerald-subtle)", borderColor: "var(--admin-emerald-border)" }}>
          <span className="font-medium" style={{ color: "var(--admin-emerald)" }}>
            {sectionTitles[params.success]} updated successfully.
          </span>
          <Link href="/admin/settings" className="text-xs hover:underline" style={{ color: "var(--admin-emerald)" }}>Dismiss</Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar Navigation */}
        <aside className="lg:col-span-1">
          <nav className="admin-shell__card sticky top-24" style={{ maxHeight: "calc(100vh - 120px)", overflow: "auto" }}>
            <ul className="space-y-1 p-2">
              {Object.entries(sectionTitles).map(([key, title]) => (
                <li key={key}>
                  <a
                    href={`#${key}`}
                    className="flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors"
                    style={{
                      color: "var(--admin-text-muted)",
                      backgroundColor: "transparent",
                    }}
                  >
                    {sectionIcons[key]}
                    <span>{title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Settings Content */}
        <main className="lg:col-span-3 space-y-8">
          {Object.entries(sectionTitles).map(([sectionKey, sectionTitle]) => (
            <section key={sectionKey} id={sectionKey} className="admin-shell__card">
              <header className="mb-6 pb-4 border-b" style={{ borderColor: "var(--admin-border)" }}>
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 rounded" style={{ backgroundColor: "var(--admin-crimson-subtle)", color: "var(--admin-crimson)" }}>
                    {sectionIcons[sectionKey]}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--admin-text)]">{sectionTitle}</h2>
                    <p className="text-sm" style={{ color: "var(--admin-text-muted)" }}>{sectionDescriptions[sectionKey]}</p>
                  </div>
                </div>
              </header>

              <form action={updateSettingsAction} method="POST" className="space-y-5">
                <input type="hidden" name="section" value={sectionKey} />
                {renderSettingsFields(sectionKey, settings[sectionKey as keyof SettingsGroup])}
                <div className="pt-4 border-t flex justify-end" style={{ borderColor: "var(--admin-border)" }}>
                  <button type="submit" className="admin-shell__btn admin-shell__btn--primary">
                    Save {sectionTitle}
                  </button>
                </div>
              </form>
            </section>
          ))}
        </main>
      </div>
    </div>
  );
}

function renderSettingsFields(section: string, values: Record<string, string>) {
  const fieldConfigs: Record<string, Array<{
    key: string;
    label: string;
    type: "text" | "number" | "email" | "tel" | "url" | "textarea" | "select" | "checkbox";
    placeholder?: string;
    options?: Array<{ value: string; label: string }>;
    min?: number;
    max?: number;
    step?: number;
    hint?: string;
    required?: boolean;
  }>> = {
    store_info: [
      { key: "store_name", label: "Store Name", type: "text", placeholder: "VEIGIN", required: true },
      { key: "store_tagline", label: "Tagline", type: "text", placeholder: "Premium Fashion & Lifestyle" },
      { key: "store_email", label: "Contact Email", type: "email", placeholder: "hello@veigin.com", required: true },
      { key: "store_phone", label: "Contact Phone", type: "tel", placeholder: "+92 300 1234567" },
      { key: "store_address", label: "Store Address", type: "textarea", placeholder: "123 Fashion Street, Karachi, Pakistan", hint: "Used in footer and order emails" },
      { key: "store_currency", label: "Currency Code", type: "text", placeholder: "PKR", hint: "ISO 4217 currency code" },
      { key: "store_timezone", label: "Timezone", type: "select", options: [
        { value: "Asia/Karachi", label: "Asia/Karachi (PKT)" },
        { value: "UTC", label: "UTC" },
        { value: "Asia/Dubai", label: "Asia/Dubai (GST)" },
        { value: "Asia/Riyadh", label: "Asia/Riyadh (AST)" },
      ], hint: "Used for date/time display" },
    ],
    business: [
      { key: "tax_rate", label: "Tax Rate (%)", type: "number", placeholder: "0", min: 0, max: 100, step: 0.01, hint: "Percentage tax applied to orders" },
      { key: "tax_inclusive", label: "Prices Include Tax", type: "checkbox", hint: "Whether displayed prices already include tax" },
      { key: "order_prefix", label: "Order Number Prefix", type: "text", placeholder: "VG", hint: "Prefix for order numbers (e.g., VG-1001)" },
      { key: "order_start_number", label: "Starting Order Number", type: "number", placeholder: "1000", min: 1, hint: "Next order will use this number" },
      { key: "low_stock_threshold", label: "Low Stock Threshold", type: "number", placeholder: "5", min: 1, hint: "Products at or below this stock level are flagged as low stock" },
      { key: "auto_cancel_hours", label: "Auto-Cancel Pending Orders (Hours)", type: "number", placeholder: "24", min: 1, hint: "Hours before unpaid orders are automatically cancelled" },
    ],
    shipping: [
      { key: "delivery_fee", label: "Standard Delivery Fee (PKR)", type: "number", placeholder: "200", min: 0, step: 1, hint: "Fee added to orders below free shipping threshold" },
      { key: "free_shipping_threshold", label: "Free Shipping Threshold (PKR)", type: "number", placeholder: "5000", min: 0, step: 1, hint: "Orders above this amount get free delivery" },
      { key: "delivery_time_min", label: "Min Delivery Days", type: "number", placeholder: "2", min: 1, hint: "Minimum estimated delivery time" },
      { key: "delivery_time_max", label: "Max Delivery Days", type: "number", placeholder: "5", min: 1, hint: "Maximum estimated delivery time" },
      { key: "cod_available", label: "Enable Cash on Delivery", type: "checkbox" },
      { key: "cod_fee", label: "COD Additional Fee (PKR)", type: "number", placeholder: "100", min: 0, step: 1, hint: "Extra fee for cash on delivery orders" },
    ],
    payment: [
      { key: "easypaisa_merchant_id", label: "Easypaisa Merchant ID", type: "text", placeholder: "MERCHANT123", hint: "Provided by Easypaisa" },
      { key: "easypaisa_app_key", label: "Easypaisa App Key", type: "text", placeholder: "APP_KEY", hint: "Provided by Easypaisa" },
      { key: "easypaisa_app_secret", label: "Easypaisa App Secret", type: "text", placeholder: "APP_SECRET", hint: "Provided by Easypaisa (keep secure)" },
      { key: "bank_transfer_details", label: "Bank Transfer Details", type: "textarea", placeholder: "Bank: HBL\nAccount: 00123456789001\nIBAN: PK36HABB...\nBeneficiary: VEIGIN", hint: "Shown to customers selecting bank transfer" },
      { key: "payment_hold_hours", label: "Payment Hold Hours", type: "number", placeholder: "48", min: 1, hint: "Hours to hold payment before auto-release for delivered orders" },
      { key: "refund_policy_days", label: "Refund Policy (Days)", type: "number", placeholder: "14", min: 1, hint: "Days within which customers can request returns/refunds" },
    ],
    display: [
      { key: "products_per_page", label: "Products Per Page", type: "number", placeholder: "12", min: 6, max: 48, step: 6, hint: "Number of products shown per page on shop pages" },
      { key: "enable_reviews", label: "Enable Product Reviews", type: "checkbox" },
      { key: "enable_wishlist", label: "Enable Wishlist", type: "checkbox" },
      { key: "show_compare_at_price", label: "Show Compare-at Price", type: "checkbox", hint: "Display strikethrough original price when on sale" },
      { key: "default_sort", label: "Default Sort Order", type: "select", options: [
        { value: "newest", label: "Newest First" },
        { value: "price_asc", label: "Price: Low to High" },
        { value: "price_desc", label: "Price: High to Low" },
        { value: "name_asc", label: "Name: A to Z" },
        { value: "best_selling", label: "Best Selling" },
      ] },
    ],
  };

  const fields = fieldConfigs[section] || [];
  return (
    <div className="space-y-5">
      {fields.map((field) => (
        <div key={field.key} className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-4 items-start">
          <label htmlFor={field.key} className="admin-shell__label md:text-right md:pt-2">
            {field.label} {field.required && <span style={{ color: "var(--admin-crimson)" }}>*</span>}
          </label>
          <div>
            {field.type === "textarea" ? (
              <textarea
                id={field.key}
                name={field.key}
                defaultValue={values[field.key] || ""}
                placeholder={field.placeholder}
                className="admin-shell__input"
                rows={3}
                required={field.required}
              />
            ) : field.type === "select" ? (
              <select
                id={field.key}
                name={field.key}
                defaultValue={values[field.key] || ""}
                className="admin-shell__select"
                required={field.required}
              >
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            ) : field.type === "checkbox" ? (
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  id={field.key}
                  name={field.key}
                  defaultChecked={values[field.key] === "true" || values[field.key] === "1"}
                  className="admin-shell__checkbox"
                />
                <span className="text-sm text-[var(--admin-text)]">Enabled</span>
              </label>
            ) : (
              <input
                type={field.type}
                id={field.key}
                name={field.key}
                defaultValue={values[field.key] || ""}
                placeholder={field.placeholder}
                className="admin-shell__input"
                min={field.min}
                max={field.max}
                step={field.step}
                required={field.required}
              />
            )}
            {field.hint && <p className="admin-shell__hint">{field.hint}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}