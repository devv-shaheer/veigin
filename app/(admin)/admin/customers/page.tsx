import { verifySession } from "@/lib/admin-auth";
import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { LOGIN_PATH } from "@/lib/admin-paths";
import { CustomersContent } from "./CustomersContent";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Customer Directory · Admin Panel",
  description: "Manage customer accounts and view order history",
  robots: { index: false, follow: false },
};

type CustomerRow = {
  email: string;
  name: string | null;
  phone: string | null;
  city: string | null;
  order_count: number;
  total_spent: number;
  last_order_at: string | null;
  created_at: string;
};

type CustomerDetail = CustomerRow & {
  orders: Array<{
    id: number;
    order_number: string;
    total: number;
    order_status: string;
    payment_status: string;
    created_at: string;
    item_count: number;
  }>;
  addresses: Array<{
    id: number;
    label: string | null;
    address: string;
    city: string;
    phone: string;
    customer_name: string | null;
    is_default: boolean;
  }>;
};

const PER_PAGE = 25;

export default async function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    has_orders?: string;
    page?: string;
    detail?: string;
  }>;
}) {
  const session = await verifySession();
  if (!session) redirect(LOGIN_PATH);

  const params = await searchParams;
  const searchQuery = params.q || "";
  const hasOrdersFilter = params.has_orders || "";
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const detailEmail = params.detail || null;
  const offset = (page - 1) * PER_PAGE;

  // Build customer list query
  let whereSql = "";
  const whereParams: (string | number)[] = [];

  if (searchQuery) {
    // Use customer_name (actual column name in orders table) instead of name
    whereSql += ` AND (email LIKE ? OR customer_name LIKE ? OR phone LIKE ? OR city LIKE ?)`;
    const term = `%${searchQuery}%`;
    whereParams.push(term, term, term, term);
  }

  // Count total customers (distinct emails from orders)
  const countSql = `
    SELECT COUNT(DISTINCT email) as total FROM orders WHERE 1=1 ${whereSql}
  `;

  const totalResult = await query<{ total: number }>(countSql, whereParams);
  const totalCustomers = totalResult[0]?.total ?? 0;
  const totalPages = Math.ceil(totalCustomers / PER_PAGE);

  // Build HAVING clause for has_orders filter
  let havingSql = "";
  if (hasOrdersFilter === "yes") {
    havingSql = " HAVING order_count > 0";
  } else if (hasOrdersFilter === "no") {
    havingSql = " HAVING order_count = 0";
  }

  const listSql = `
    SELECT
      email,
      customer_name as name,
      phone,
      city,
      COUNT(*) as order_count,
      COALESCE(SUM(total), 0) as total_spent,
      MAX(created_at) as last_order_at,
      MIN(created_at) as created_at
    FROM orders
    WHERE 1=1 ${whereSql}
    GROUP BY email, customer_name, phone, city
    ${havingSql}
    ORDER BY last_order_at DESC
    LIMIT ? OFFSET ?
  `;

  const listParams = [...whereParams, PER_PAGE, offset];
  const customers = await query<CustomerRow>(listSql, listParams);

  // Fetch detail if requested (by email, not ID)
  let detail: CustomerDetail | null = null;
  if (detailEmail) {
    // Get customer info
    const customerInfo = await query<CustomerRow>(
      `SELECT
        email, customer_name as name, phone, city,
        COUNT(*) as order_count,
        COALESCE(SUM(total), 0) as total_spent,
        MAX(created_at) as last_order_at,
        MIN(created_at) as created_at
      FROM orders
      WHERE email = ?
      GROUP BY email, customer_name, phone, city`,
      [detailEmail]
    );

    if (customerInfo.length) {
      // Get orders
      const orders = await query<any>(
        `SELECT id, order_number, total, order_status, payment_status, created_at,
                (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
         FROM orders o
         WHERE email = ?
         ORDER BY created_at DESC`,
        [detailEmail]
      );

      // Get addresses (from most recent orders)
      const addresses = await query<any>(
        `SELECT DISTINCT
          o.id, o.address, o.city, o.phone, o.customer_name,
          NULL as label,
          CASE WHEN o.id = (SELECT MAX(id) FROM orders WHERE email = o.email) THEN 1 ELSE 0 END as is_default
         FROM orders o
         WHERE o.email = ?
         ORDER BY o.id DESC`,
        [detailEmail]
      );

      detail = {
        ...customerInfo[0],
        orders,
        addresses,
      };
    }
  }

  // Build the buildUrl function inline for server-side URL construction
  const buildUrl = (params: Record<string, string>) => {
    const searchParams = new URLSearchParams(params);
    return `/admin/customers?${searchParams.toString()}`;
  };

  return (
    <CustomersContent
      searchQuery={searchQuery}
      hasOrdersFilter={hasOrdersFilter}
      page={page}
      detailEmail={detailEmail}
      totalPages={totalPages}
      totalCustomers={totalCustomers}
      customers={customers}
      detail={detail}
    />
  );
}