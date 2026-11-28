# Feature-to-Database Mapping for VEIGIN Admin Panel (Stage 11E)

This document maps each admin panel feature to its underlying database tables, columns, and queries needed for implementation.

---

## 1. Product Management (`/admin/products`) — **EXISTING**

### Database Tables
- **products** — Core product data
- **categories** — Product categorization
- **drops** — Product drops/collections

### Key Columns (products)
| Column | Type | Purpose |
|--------|------|---------|
| id | INT UNSIGNED PK | Primary key |
| name | VARCHAR(200) | Product name |
| slug | VARCHAR(200) UNIQUE | URL-friendly identifier |
| description | TEXT | Product description |
| price | INT | Price in PKR |
| compare_at_price | INT NULL | Original price for sale display |
| category_id | INT UNSIGNED FK | Category reference |
| drop_id | INT UNSIGNED FK | Drop reference |
| stock | INT | Current inventory |
| availability | ENUM | 'available', 'sold_out', 'exclusive', 'archived' |
| restockable | BOOLEAN | Can be restocked |
| is_best_seller | BOOLEAN | Featured on best-sellers page |
| is_new_drop | BOOLEAN | Featured on new-drops page |
| is_exclusive | BOOLEAN | Featured on exclusive page |
| material | VARCHAR(255) | Material description |
| length_label | VARCHAR(120) | Size/length info |
| build_details | TEXT | Construction details |
| media | JSON | Array of {url, alt, type} |
| scatter_x, scatter_y, rotation | DECIMAL | Legacy scatter positions |
| show_on_home | BOOLEAN | Show on homepage |
| home_x, home_y, home_rot | DECIMAL | Homepage scatter positions |

### Existing Implementation
- Full CRUD via Server Actions in `app/(admin)/admin/products/page.tsx`
- Search by name/slug, filter by category
- Modal forms for create/edit
- Smart delete (archives if referenced in orders)

---

## 2. Inventory Management (`/admin/inventory`) — **NEW**

### Database Tables
- **products** (primary)
- **categories** (for filtering)

### Required Queries
```sql
-- Full inventory list with search/filter
SELECT p.id, p.name, p.slug, p.stock, p.availability, p.restockable,
       p.price, p.compare_at_price, c.name AS category_name, c.slug AS category_slug
FROM products p
LEFT JOIN categories c ON c.id = p.category_id
WHERE p.availability <> 'archived'
  AND (p.name LIKE ? OR p.slug LIKE ?)  -- search
  AND (? = '' OR c.slug = ?)             -- category filter
ORDER BY p.stock ASC;                    -- low stock first

-- Low stock count (stock > 0 AND stock <= 5)
SELECT COUNT(*) FROM products WHERE stock > 0 AND stock <= 5 AND availability <> 'archived';

-- Out of stock count
SELECT COUNT(*) FROM products WHERE stock = 0 AND availability <> 'archived';

-- Stock adjustment (increment/decrement)
UPDATE products SET stock = GREATEST(0, stock + ?) WHERE id = ?;
```

### Server Actions Needed
- `adjustStockAction(formData)` — Increment/decrement stock with reason
- `setAvailabilityAction(formData)` — Update availability status

---

## 3. Order Management (`/admin/orders`) — **NEW**

### Database Tables
- **orders** — Order records
- **order_items** — Line items per order
- **products** — Product details for items
- **discount_codes** — Applied discounts

### Key Columns (orders)
| Column | Type | Purpose |
|--------|------|---------|
| id | INT UNSIGNED PK | Primary key |
| order_number | VARCHAR(32) UNIQUE | Human-readable order ID (VGN-...) |
| customer_name | VARCHAR(200) | Buyer name |
| phone | VARCHAR(40) | Contact phone |
| email | VARCHAR(200) | Contact email |
| address | TEXT | Shipping address |
| city | VARCHAR(120) | City |
| subtotal | INT | Items total |
| auto_discount | INT | Auto discount applied |
| discount_code_id | INT UNSIGNED FK | Manual discount code |
| discount_code_amount | INT | Discount amount |
| delivery_fee | INT | Shipping cost |
| total | INT | Grand total |
| payment_method | ENUM | 'cod', 'easypaisa' |
| payment_status | ENUM | 'awaiting_payment', 'paid', 'rejected', 'refunded' |
| order_status | ENUM | 'placed', 'processing', 'dispatched', 'in_transit', 'delivered', 'cancellation_requested', 'cancelled', 'replacement_requested', 'refunded' |
| easypaisa_txn_id | VARCHAR(120) | Transaction reference |
| payment_proof_url | VARCHAR(500) | Payment screenshot |
| payment_hold_until | DATETIME | Hold release time |
| tracking_id | VARCHAR(120) | Courier tracking |
| rejection_reason | VARCHAR(255) | If rejected |

### Required Queries
```sql
-- Order list with search/filter/pagination
SELECT o.*, 
       (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) AS item_count
FROM orders o
WHERE (? = '' OR o.order_number LIKE ? OR o.customer_name LIKE ? OR o.email LIKE ? OR o.phone LIKE ?)
  AND (? = '' OR o.payment_status = ?)
  AND (? = '' OR o.order_status = ?)
ORDER BY o.created_at DESC
LIMIT ? OFFSET ?;

-- Order detail with items
SELECT o.*, 
       JSON_ARRAYAGG(
         JSON_OBJECT(
           'id', oi.id,
           'product_id', oi.product_id,
           'product_name', oi.product_name,
           'unit_price', oi.unit_price,
           'quantity', oi.quantity
         )
       ) AS items
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
WHERE o.id = ?
GROUP BY o.id;

-- Update order status
UPDATE orders SET order_status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;

-- Update payment status
UPDATE orders SET payment_status = ?, payment_proof_url = ?, easypaisa_txn_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?;

-- Add tracking
UPDATE orders SET tracking_id = ?, order_status = 'dispatched', updated_at = CURRENT_TIMESTAMP WHERE id = ?;
```

### Server Actions Needed
- `updateOrderStatusAction(formData)` — Change order_status
- `updatePaymentStatusAction(formData)` — Change payment_status with proof/txn
- `addTrackingAction(formData)` — Add tracking ID, auto-set to dispatched

---

## 4. Customer Management (`/admin/customers`) — **NEW**

### Database Tables
- **orders** — Primary source (customers are derived from orders)
- No dedicated customers table — customers are identified by email/phone

### Required Queries
```sql
-- Customer directory (aggregated from orders)
SELECT 
  o.email,
  o.customer_name,
  o.phone,
  COUNT(DISTINCT o.id) AS order_count,
  SUM(o.total) AS lifetime_value,
  MAX(o.created_at) AS last_order_at,
  GROUP_CONCAT(DISTINCT o.order_number ORDER BY o.created_at DESC) AS recent_orders
FROM orders o
GROUP BY o.email, o.customer_name, o.phone
ORDER BY last_order_at DESC
LIMIT ? OFFSET ?;

-- Customer order history (detail view)
SELECT o.id, o.order_number, o.subtotal, o.auto_discount, o.discount_code_amount,
       o.delivery_fee, o.total, o.payment_method, o.payment_status, o.order_status,
       o.tracking_id, o.created_at
FROM orders o
WHERE o.email = ?
ORDER BY o.created_at DESC;

-- Search customers
SELECT ... (same as directory) 
WHERE email LIKE ? OR customer_name LIKE ? OR phone LIKE ?;
```

### Server Actions
- None needed (read-only)

---

## 5. Discount Management (`/admin/discounts`) — **NEW**

### Database Tables
- **discount_codes** — Discount codes

### Key Columns (discount_codes)
| Column | Type | Purpose |
|--------|------|---------|
| id | INT UNSIGNED PK | Primary key |
| code | VARCHAR(64) UNIQUE | Discount code (e.g., "SAVE20") |
| type | ENUM | 'percentage', 'fixed' |
| value | INT | Percentage (0-100) or fixed amount in PKR |
| min_subtotal | INT | Minimum order subtotal |
| expires_at | DATETIME NULL | Expiration date |
| usage_limit | INT NULL | Max total uses |
| used_count | INT | Times used |
| active | BOOLEAN | Enabled/disabled |

### Required Queries
```sql
-- List all discounts
SELECT * FROM discount_codes ORDER BY created_at DESC;

-- Create discount
INSERT INTO discount_codes (code, type, value, min_subtotal, expires_at, usage_limit, active)
VALUES (?, ?, ?, ?, ?, ?, ?);

-- Update discount
UPDATE discount_codes SET type = ?, value = ?, min_subtotal = ?, expires_at = ?, usage_limit = ?, active = ? WHERE id = ?;

-- Delete discount
DELETE FROM discount_codes WHERE id = ?;

-- Validate code (for checkout)
SELECT * FROM discount_codes 
WHERE code = ? AND active = 1 
  AND (expires_at IS NULL OR expires_at > NOW())
  AND (usage_limit IS NULL OR used_count < usage_limit);
```

### Server Actions Needed
- `createDiscountAction(formData)`
- `updateDiscountAction(formData)`
- `deleteDiscountAction(formData)`

---

## 6. Storefront Management (`/admin/storefront`) — **NEW**

### Database Tables
- **products** — Featured products (is_best_seller, is_new_drop, is_exclusive, show_on_home)
- **settings** — Announcement bar

### Key Columns (products for homepage)
| Column | Type | Purpose |
|--------|------|---------|
| show_on_home | BOOLEAN | Display in scatter field |
| home_x | DECIMAL(5,2) | X position % (0-100) |
| home_y | DECIMAL(5,2) | Y position % (0-100) |
| home_rot | DECIMAL(4,2) | Rotation degrees |
| is_best_seller | BOOLEAN | Best sellers page |
| is_new_drop | BOOLEAN | New drops page |
| is_exclusive | BOOLEAN | Exclusive page |

### Required Queries
```sql
-- Homepage products (scatter field)
SELECT id, name, slug, price, home_x, home_y, home_rot
FROM products
WHERE show_on_home = 1 AND availability <> 'archived'
ORDER BY id;

-- Update homepage position
UPDATE products SET home_x = ?, home_y = ?, home_rot = ?, show_on_home = ? WHERE id = ?;

-- Toggle flags
UPDATE products SET is_best_seller = ? WHERE id = ?;
UPDATE products SET is_new_drop = ? WHERE id = ?;
UPDATE products SET is_exclusive = ? WHERE id = ?;

-- Announcement (settings table)
SELECT setting_value FROM settings WHERE setting_key = 'announcement';
UPDATE settings SET setting_value = ? WHERE setting_key = 'announcement';
```

### Server Actions Needed
- `updateHomePositionAction(formData)` — Update home_x, home_y, home_rot, show_on_home
- `toggleProductFlagAction(formData)` — Toggle best_seller/new_drop/exclusive
- `updateAnnouncementAction(formData)` — Update announcement text

---

## 7. Store Settings (`/admin/settings`) — **NEW**

### Database Tables
- **settings** — Key-value store

### Current Settings
| setting_key | Type | Description | Default |
|-------------|------|-------------|---------|
| delivery_fee | INT | Shipping cost in PKR | 200 |
| discount_threshold | INT | Min subtotal for auto discount | 5000 |
| discount_percent | INT | Auto discount percentage | 10 |
| payment_hold_hours | INT | Hours to hold COD payment | 24 |

### Additional Settings Needed
| setting_key | Type | Description |
|-------------|------|-------------|
| announcement | TEXT | Storefront announcement bar text |
| store_name | VARCHAR(200) | Store display name |
| store_email | VARCHAR(200) | Contact email |
| store_phone | VARCHAR(40) | Contact phone |
| store_address | TEXT | Physical address |

### Required Queries
```sql
-- Get all settings
SELECT setting_key, setting_value FROM settings;

-- Upsert setting
INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);
```

### Server Actions Needed
- `updateSettingsAction(formData)` — Bulk update all settings

---

## 8. Overview Dashboard (`/admin`) — **PARTIAL (NEEDS RECENT ORDERS/PRODUCTS)**

### Existing Queries
- Total products, orders, categories, low stock count

### Missing Queries
```sql
-- Recent orders (last 5)
SELECT id, order_number, customer_name, total, payment_status, order_status, created_at
FROM orders
ORDER BY created_at DESC
LIMIT 5;

-- Recent products (last 5)
SELECT id, name, slug, price, stock, availability, created_at
FROM products
WHERE availability <> 'archived'
ORDER BY created_at DESC
LIMIT 5;
```

---

## Summary: Implementation Priority

| Feature | Tables | Server Actions | Complexity |
|---------|--------|----------------|------------|
| Product Management | products, categories | 3 (create, update, delete) | ✅ Done |
| Inventory Management | products | 2 (adjust stock, set availability) | Medium |
| Order Management | orders, order_items | 3 (status, payment, tracking) | High |
| Customer Management | orders (derived) | 0 (read-only) | Low |
| Discount Management | discount_codes | 3 (CRUD) | Medium |
| Storefront Management | products, settings | 3 (position, flags, announcement) | Medium |
| Store Settings | settings | 1 (bulk update) | Low |
| Overview Dashboard | orders, products | 0 (read-only) | Low |

---

## Design Token References (from globals.css)

All admin pages should use these CSS custom properties scoped to `.admin-shell`:

```css
:root {
  --admin-bg: #0a0a0a;
  --admin-surface: #111111;
  --admin-surface-elevated: #181818;
  --admin-border: #2a2a2a;
  --admin-border-hover: #3a3a3a;
  --admin-text: #f5f5f5;
  --admin-text-muted: #a0a0a0;
  --admin-text-subtle: #6a6a6a;
  --admin-crimson: #c0392b;
  --admin-crimson-bright: #e74c3c;
  --admin-crimson-subtle: #2d1b1b;
  --admin-crimson-border: #4a2020;
  --admin-success: #27ae60;
  --admin-success-subtle: #1a3a2a;
  --admin-warning: #f39c12;
  --admin-warning-subtle: #3a2f1a;
  --admin-danger: #c0392b;
  --admin-danger-subtle: #3a1a1a;
  --admin-radius: 6px;
  --admin-radius-sm: 4px;
  --admin-radius-lg: 10px;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-8: 48px;
}
```

Component classes to use:
- `.admin-shell__card` — Container with surface background and border
- `.admin-shell__btn` — Button base
- `.admin-shell__btn--primary` — Crimson primary button
- `.admin-shell__btn--secondary` — Border button
- `.admin-shell__btn--ghost` — Text-only button
- `.admin-shell__btn--danger` — Danger button
- `.admin-shell__btn--sm` — Small button
- `.admin-shell__input` — Form input
- `.admin-shell__select` — Form select
- `.admin-shell__textarea` — Form textarea
- `.admin-shell__label` — Form label
- `.admin-shell__form-group` — Form field wrapper
- `.admin-shell__table` — Data table
- `.admin-shell__badge` — Status badge
- `.admin-shell__badge--success` — Green badge
- `.admin-shell__badge--warning` — Amber badge
- `.admin-shell__badge--danger` — Red badge
- `.admin-shell__stat` — Dashboard stat card
- `.admin-shell__stats-grid` — Grid of stat cards
- `.admin-shell__card-header` — Card header
- `.admin-shell__card-title` — Card title
- `.admin-shell__card-desc` — Card description
- `.admin-shell__actions` — Action button group
- `.admin-shell__empty` — Empty state
- `.admin-shell__nav-item` — Sidebar nav item
- `.admin-shell__nav-item--active` — Active nav
- `.admin-shell__nav-item--disabled` — Disabled nav
- `.admin-shell__nav-section` — Nav section
- `.admin-shell__nav-section-title` — Nav section label