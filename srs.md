# **Veigin: Software Requirements Specification (SRS)** 

**Version:** 1.1 (complete, supersedes v1.0 and the v1.1 addendum) **Status:** Verified requirements baseline **Project type:** Single-brand e-commerce website **Business:** Veigin, gothic and alternative jewellery and accessories **Market:** Pakistan 

## **1. Project Overview** 

### **1.1 Purpose** 

Veigin is an alternative-fashion brand selling gothic jewellery and accessories. The website sells Veigin products online and establishes Veigin as a recognizable name in Pakistan's alternative-fashion community. It must work as a complete e-commerce system (browsing, discovery, checkout, payment, order tracking, cancellations, replacements, admin management) and must not feel like a generic store template. Design and interaction must reinforce Veigin's identity. 

### **1.2 Business Objectives** 

- Sell gothic and alternative jewellery nationwide. 

- Establish Veigin as a distinctive brand, not a reseller. 

- Provide a memorable shopping experience. 

- Build trust through transparency, accurate product descriptions and reviews. 

- Encourage repeat purchases through discounts and, later, loyalty benefits. 

- Promote new drops, exclusive releases, sales and best sellers. 

- Initial milestone: at least 50 orders, positive customer experience, and the start of repeat purchases. 

### **1.3 Brand Positioning** 

Veigin sits at the premium end of Pakistan's niche alternative jewellery market while staying cheaper than its main competitor, Tenshovoid. Differentiation comes from brand identity, product presentation, website experience, product quality, packaging, customer experience, exclusivity and, later, community and loyalty. Veigin intends to beat competitors on overall customer experience and brand value, not only price. 

### **1.4 Target Audience** 

Teenagers and young people in Pakistan interested in gothic and alternative fashion, dark aesthetics, jewellery, subcultures and niche online communities. The site should appeal to this niche, not imitate a mass-market fashion store. 

## **2. Project Scope** 

### **2.1 Launch Scope (Phases A to C)** 

- Homepage with scattered product layout and entrance animation 

- Product catalog, categories, search and recommended searches 

- New drops, best sellers, exclusive products and sales sections 

- Product detail pages with photos, video, specifications and material disclosure 

- Shopping cart and guest checkout 

- Payments: Cash on Delivery and manual Easypaisa transfer 

- Automatic order-value discount and discount codes 

- Nationwide delivery at a flat fee 

- Order confirmation by website and email 

- Order tracking page on the Veigin site using admin-entered tracking data 

- Cancellation requests, replacement requests and refund handling 

- Scheduled drops, exclusive and restockable products, and the exclusive archive 

- Admin dashboard (products, inventory, orders, payment verification, discounts, requests, settings, content) 

- Responsive desktop and mobile interfaces 

### **2.2 Phase D (after the first orders)** 

- Customer accounts with order history and cumulative spend tracking 

- Public reviews with star ratings, text and images 

- Loyalty tiers and loyalty cards 

### **2.3 Deferred (not in launch or Phase D)** 

- Gateway payments (card, JazzCash, Easypaisa API), pending a merchant account 

- Live courier API tracking, pending courier selection 

- WhatsApp and SMS notifications 

- Discord account linking and role synchronization 

### **2.4 Out of Scope** 

Unless separately approved: international shipping, physical stores, third-party marketplace or multivendor features, native Android or iOS apps, and manufacturing or forging workflows. Veigin may later sell original, personally forged products; the system must allow adding them without redesigning the store. 

## **3. User Roles** 

### **3.1 Guest** 

A visitor who is not logged in. Can browse, search, view products, categories, drops and the exclusive archive, read reviews (once live), add to cart, check out without an account, and track an order using order ID plus phone number or email. 

### **3.2 Registered Customer (Phase D)** 

All guest permissions, plus order history, cumulative purchase history, account management, and loyalty status and benefits once loyalty launches. 

### **3.3 Store Owner / Administrator** 

Full control over products, prices, inventory, categories, drops, promotions, discount codes, orders, payment verification, customers, reviews, cancellations, replacements, refunds, tracking, store content and settings. Admin access must be protected by authentication and authorization. 

## **4. Brand Design and UI Requirements** 

### **4.1 Design Direction** 

Dark, distressed, gothic alternative aesthetic with: 

- Dirty grey background tones and grainy surface textures 

- Washed-out sparkles 

- Metallic silver accents 

- Shining crimson details and subtle blood-inspired accents (such as blood-red dots) 

- A combination of brutalist and gothic typography 

The look should feel raw, dark, premium, alternative and editorial, and must not look like a generic black storefront. 

### **4.2 Typography** 

Brutalist and gothic typography combined. Exact font families are a design decision. Text must stay readable on desktop and mobile. 

### **4.3 Homepage Layout** 

An art-directed scattered product layout. 

- Products are scattered across the page at moderate density: neither sparse nor crowded. 

- Positions are fixed and identical on every visit, never randomized. 

- Controlled tilt is allowed. Products never appear upside down or sideways. 

- Products never overlap or stack, and keep enough spacing to be clickable. 

- Product cards remain legible and recognizable as product images. 

- The layout is responsive, and the scattered layout is preserved on mobile rather than replaced by a standard grid. 

### **4.4 Responsive Design** 

Desktop, laptop, tablet and mobile are all supported. Mobile interactions must not depend on hover. 

### **4.5 Motion Design** 

Smooth, intentional animation: homepage product entrance, product hover effects, page transitions, product image transitions, cart interaction animations and subtle interface transitions. Motion must not make navigation slow or difficult. Users with reduced-motion settings get a reduced-motion experience. 

## **5. Homepage Requirements** 

### **5.1 Entrance Animation** 

On visiting the homepage, products appear to fall or be thrown onto a surface and scatter into their predetermined positions. The animation allows controlled movement before settling, keeps products within the orientation limits, prevents overlap, always settles into the same fixed layout, and never blocks clicking or browsing. 

### **5.2 Homepage Content** 

The homepage provides access to the scattered product display, search with recommended searches, categories, all products, best sellers, new drops, exclusive products, and active sales or promotions. Exact placement is finalized during design. 

### **5.3 Hover Interaction (Desktop)** 

Hovering a product shows its name and price. The hover text stays upright regardless of the product's tilt, has adequate contrast, is easy to read and does not unnecessarily cover other products. 

### **5.4 Touch Interaction (Mobile)** 

Product name and price must be reachable by touch without hover, the user must be able to select a product, and the scattered layout must stay usable. The exact reveal interaction is decided during implementation. 

## **6. Navigation and Product Discovery** 

### **6.1 Search** 

A search bar finds products by name, category, product type and other searchable metadata. 

### **6.2 Recommended Searches** 

The search interface shows recommended searches. Initial method: manually curated suggestions managed by the admin. Popular-search suggestions can come later. 

### **6.3 Categories** 

Initial categories are Rings, Bracelets and Necklaces with pendants. An All Products view is also provided. New categories must be addable later. 

### **6.4 Discovery Sections** 

Admin-managed sections for Best Sellers, New Drops, Exclusive Products and Sales or promotions when active. 

## **7. Product Management and Product Pages** 

### **7.1 Initial Range** 

The first drop contains bracelets, pendant necklaces and rings. 

### **7.2 Product Page Hierarchy** 

1. Product name (highly visible and memorable) 

2. Product imagery and video 

3. Price 

4. Details and specifications 

5. Reviews (once live; must not overpower product identity) 

### **7.3 Product Media** 

Multiple photographs, video and media slides per product, with image viewing. Media is stored on Cloudinary. Exact media limits are set during implementation. 

### **7.4 Product Details** 

A dedicated details section supporting length, dimensions, build and construction details, material and other product-specific fields. Not every field applies to every product. 

### **7.5 Material Transparency** 

Material information must be accurate so customers are not misled about materials or construction. The admin specifies material information per product. 

### **7.6 Pricing** 

Target ranges: rings about PKR 700 to 1,000; necklaces about PKR 1,500 to 2,000 or more. These are targets, not limits. The admin sets each product's price individually. 

### **7.7 Availability States** 

At least: Available, Sold Out, Exclusive and Archived. Implementation may use separate availability and exclusivity fields. 

### **7.8 Exclusive Products** 

Some products are exclusive to a drop, released in limited quantity, never restocked, and remain documented after the release ends. 

### **7.9 Restockable Products** 

The admin can mark products as restockable and update stock when they return. 

### **7.10 Sold-Out Behavior** 

When inventory reaches zero the product automatically shows Sold Out, cannot be purchased, and availability updates automatically. 

## **8. Drops and Release Management** 

### **8.1 Drop System** 

The admin can create a drop, assign and manage products in it, edit it before release, prepare it in advance, schedule automatic release, publish at the configured time, and end or archive it. 

### **8.2 Scheduled Publishing** 

Drops publish automatically at the scheduled date and time. The owner does not need to be online. 

### **8.3 Drop Exclusivity** 

A drop may hold exclusive products, restockable products or both. Each product's availability rules are preserved. 

### **8.4 Drop Management** 

The dashboard lists and manages upcoming, active and completed drops. 

## **9. Exclusive Archive: The Fallen Soldiers** 

The working title may be changed by the owner before launch. 

- A dedicated page preserving exclusive products that have sold out and will not return. 

- Shows product names and black-and-white pictures, in a minimal design with no unnecessary information or decoration. 

- Archived exclusive products are not purchasable. 

- Serves as a visual record of past releases and reinforces the exclusivity of Veigin drops. 

## **10. Shopping Cart** 

### **10.1 Functionality** 

Customers can add and remove products, change quantities, and review selected products, prices, subtotal, applicable discounts, delivery charge and final total. 

### **10.2 Availability** 

The cart reflects current stock. The system prevents orders for quantities above available inventory. 

### **10.3 Price Breakdown** 

The cart and checkout clearly separate: original subtotal, automatic discount, discount code deduction, delivery charge and final payable amount. 

## **11. Checkout** 

### **11.1 Guest Checkout** 

Customers can order without an account. Account creation is optional. 

### **11.2 Required Information** 

Full name, contact number, email address and full delivery address (including city and any address details needed for reliable delivery). 

### **11.3 Delivery Estimate and Fee** 

Checkout displays an estimated delivery time of 2 to 5 working days. The delivery fee is PKR 200 nationwide, the same for every destination, and is configurable by the owner. 

### **11.4 Checkout Summary** 

Before submitting, the customer sees products, quantities, prices, subtotal, automatic discount, applied code, delivery fee, final payable total and payment method. 

### **11.5 Email and Promotions** 

Email is collected for order communication and possible promotions. Promotional use requires customer consent and an opt-out mechanism. 

## **12. Payment System** 

### **12.1 Launch Payment Methods** 

1. Cash on Delivery (COD) 

2. Manual Easypaisa transfer 

Card, JazzCash and Easypaisa gateway payments are deferred until a merchant account exists. Whether a merchant account is available and what it requires must be confirmed directly with the provider before any gateway work starts. 

### **12.2 COD** 

COD orders are created without online payment. The payable amount is clearly visible to the customer and the admin. Stock is deducted at order placement. 

### **12.3 Manual Easypaisa Flow** 

1. The customer selects Easypaisa at checkout and sees the Veigin account number, account title and exact amount. 

2. The order is created with payment status Awaiting Payment, and stock is held. 

3. The customer submits a transaction ID and optional screenshot on the confirmation page. 

4. The owner verifies the payment against the actual account balance and marks the order Paid, or rejects it with a reason. 

5. If no proof is submitted before the hold window ends (default 24 hours, configurable), the order is auto-cancelled and stock is released. 

6. An order is never processed or dispatched while its payment status is Awaiting Payment or Rejected. 

A screenshot alone is not proof of payment. The owner should mark an order Paid only after seeing the funds in the account. 

### **12.4 Payment Architecture** 

Payment handling is built behind a provider interface so a gateway can replace or join the manual flow later without changing order or inventory logic. 

### **12.5 Payment Status** 

The system records payment status (Awaiting Payment, Paid, Rejected, Refunded) and never treats an unverified or failed payment as paid. 

## **13. Discounts and Promotions** 

### **13.1 Automatic Order-Value Discount** 

Orders of PKR 5,000 or more receive 10% off automatically. Both values are admin-configurable. 

### **13.2 Discount Codes** 

The system supports discount codes for returning customers, special promotions, limited campaigns and, later, loyalty rewards. 

### **13.3 Stacking** 

One discount code per order. A code can be combined with an eligible automatic discount, and the system calculates the combined discount correctly. 

### **13.4 Calculation Order** 

Subtotal, then automatic discount, then discount code, then delivery fee, then final total. Percentage codes apply to the subtotal after the automatic discount. 

### **13.5 Promotion Administration** 

The owner manages code name and value, eligibility, expiration, usage limits and activation or deactivation. All thresholds and rules are configurable. 

### **13.6 Bundle Incentives** 

Spending-threshold or product-combination incentives need not appear as conventional bundles. For example, spending over a set amount triggers an automatic discount. 

## **14. Customer Accounts (Phase D)** 

- Registration is optional and never required to place an order. 

- Accounts provide order history, purchase records and cumulative spending. 

- The system preserves order history for loyalty and customer-service purposes. 

- Cumulative spend counts delivered orders only, minus refunded amounts. Cancelled and rejected orders never count. 

## **15. Loyalty System (Phase D)** 

Veigin intends to give loyalty status based on cumulative purchasing, with configurable spending thresholds, multiple tiers, tier assignment, a loyalty card or status display, and tier perks such as special discount codes and giveaway eligibility. Tier names and thresholds are undecided. Rules must be changeable by the owner without rewriting the application. 

Discord linking, automatic role assignment and role-based perks are deferred and out of scope until after launch. The data model should not prevent adding them later. 

## **16. Reviews and Ratings (Phase D)** 

- Public reviews with star ratings, written feedback and image uploads, associated with the relevant product. 

- Reviews publish without routine manual approval. 

- Reviews are limited to verified buyers. 

- A report button lets visitors flag reviews, and the owner can remove inappropriate, fraudulent or abusive reviews. 

- Image uploads are validated and protected. 

- Reviews appear on the product page but never outrank product name, visuals and specifications. 

## **17. Order Management** 

### **17.1 Automatic Order Creation** 

Orders are created automatically at checkout. The owner does not approve every order before it is accepted. 

### **17.2 Order Records** 

Each order holds a unique ID, customer information, items, quantities, prices, discounts, delivery fee, final total, payment method, payment status, order status, tracking information and timestamps. 

### **17.3 Order Statuses** 

Order Placed, Awaiting Payment (manual payment orders), Processing, Dispatched, In Transit, Delivered, Cancellation Requested, Cancelled, Replacement Requested and Refunded. The exact structure may be refined during implementation. 

### **17.4 Order Administration** 

The owner can view, search and filter orders, open details, update fulfillment status and tracking information, verify or reject payment proof, and manage cancellations, replacements and refund decisions. 

## **18. Order Notifications** 

- Confirmation is shown on the website and sent by email at launch. WhatsApp and SMS are deferred. 

- Events covered: order placement, payment status, dispatch, tracking availability, delivery, cancellation status, replacement requests and refund status. 

- Notifications reflect the actual order state, and no confirmation is sent for failed or incomplete orders. 

## **19. Order Tracking** 

- Veigin provides a tracking page on its own website, so customers do not need to visit a courier site to see progress. 

- At launch the page shows the admin-entered tracking ID and a status timeline. Courier API data is added once a courier is chosen. 

- Guests track an order using order ID plus phone number or email. 

- The page handles unavailable, delayed or incomplete updates gracefully. 

## **20. Cancellation Policy and Workflow** 

### **20.1 Policy** 

Customers may request cancellation within 24 hours of placing an order and must give a reason. 

### **20.2 Approval** 

If the order has not been dispatched, the request is auto-approved and stock is released. Otherwise the request goes to the owner for review with the customer's reason. 

### **20.3 Workflow** 

1. The customer opens the order and requests cancellation within the window. 

2. The customer provides a reason. 

3. The system records the request. 

4. It is auto-approved, or the owner reviews it. 

5. The order status updates and the customer is notified. 

## **21. Replacement and Refund Policy** 

### **21.1 Policy** 

- No returns for change of mind. 

- Replacement requests are accepted within 7 days of delivery. Requests after that window are rejected by the system. 

- Refunds are available for damaged products. 

- A photo or unboxing video is required as evidence. 

- Refunds go back via the original payment method, or by bank transfer for COD orders. 

### **21.2 Workflow** 

1. The customer opens the order within 7 days of delivery. 

2. The customer selects the product and issue and gives a reason. 

3. The customer attaches photo or video evidence. 

4. The request is recorded with a status. 

5. The owner reviews it and decides on replacement or refund. 

6. The customer is notified of the outcome. 

## **22. Customer Support** 

Support channels are email and, once it exists, the Discord server. Support contact information must be easy to find on the website. The owner must be able to manage concerns about orders, delivery, payments, product issues, replacements, refunds and account issues. A dedicated website contact form is not confirmed. 

## **23. Delivery and Fulfillment** 

- Nationwide delivery within Pakistan. 

- Flat delivery fee of PKR 200, estimated 2 to 5 working days, both displayed at checkout. 

- The courier is not yet selected. When chosen, it should support tracking updates that can feed the Veigin tracking page. 

## **24. Admin Dashboard** 

### **24.1 General** 

A private, authenticated dashboard that is clean, practical, easy to use and responsive on desktop and mobile. The owner has comprehensive control over store operations without needing a developer for ordinary changes. 

### **24.2 Product Administration** 

Add, edit, delete or deactivate products; upload photos and video; set names, descriptions, prices, material information, measurements, construction details and categories; set stock quantities; mark products exclusive or restockable; assign products to drops; set availability. 

### **24.3 Inventory** 

Inventory updates when orders are placed (COD) or held (manual payment) and when holds expire or orders are cancelled. The system prevents overselling, including when two customers try to buy the last unit at the same time. The owner can adjust stock manually. 

### **24.4 Drop Administration** 

Create, edit, schedule, publish and end drops, and assign products to them. 

### **24.5 Order and Payment Administration** 

View, search and filter all orders; view customer and order details; manage fulfillment and statuses; add tracking information; verify or reject payment proof; review cancellations, replacements and refunds. 

### **24.6 Customer Administration** 

View contact information and order history. Cumulative spending and loyalty status appear once Phase D ships. 

### **24.7 Store Configuration** 

The owner manages delivery fee, automatic discount threshold and percentage, discount codes, payment hold window, Easypaisa account details, product availability, drop settings, recommended searches and store content. Changes that require deployment may remain developer-managed. 

## **25. Functional Requirements** 

|ID|Requirement|Phase|
|---|---|---|
|FR-001|The system shall provide a public Veigin storefront.|A|
|FR-002|The homepage shall display products in a scattered layout.|A|
|FR-003|Homepage product positions shall stay the same between visits.|A|
|FR-004|Homepage products shall animate into their final positions on<br>entrance.|A|
|FR-005|Product orientations shall obey the rotation restrictions.|A|
|FR-006|Homepage product interaction shall reveal product name and price.|A|
|FR-007|Hover text shall stay upright and readable.|A|
|FR-008|The mobile interface shall provide the same product information<br>without hover.|A|
|FR-009|The website shall provide product search.|A|
|FR-010|The search interface shall show recommended searches.|A|
|FR-011|The website shall provide category browsing.|A|
|FR-012|The website shall provide All Products browsing.|A|
|FR-013|The website shall provide Best Sellers.|A|
|FR-014|The website shall provide New Drops.|A|
|FR-015|The website shall provide Exclusive Products.|A|



|ID|Requirement|Phase|
|---|---|---|
|FR-016|Product pages shall support photos and videos.|A|
|FR-017|Product pages shall display the product name prominently.|A|
|FR-018|Product pages shall have a dedicated specifications section.|A|
|FR-019|Product details shall support length, build and material information.|A|
|FR-020|The administrator shall be able to manage product data.|A|
|FR-021|The system shall support exclusive and restockable product types.|A|
|FR-022|The system shall automatically show Sold Out when stock reaches<br>zero.|A|
|FR-023|The system shall prevent purchase of unavailable inventory.|A|
|FR-024|The system shall provide a dedicated exclusive product archive.|E|
|FR-025|The archive shall show product names and black-and-white images.|E|
|FR-026|The system shall support drop creation and management.|E|
|FR-027|The system shall support scheduled drop publishing.|E|
|FR-028|The system shall provide a shopping cart.|A|
|FR-029|Customers shall be able to add, remove and change quantities in the<br>cart.|A|
|FR-030|Checkout shall support guest orders.|A|
|FR-031|Checkout shall collect name, phone, email and delivery address.|A|
|FR-032|Checkout shall display the estimated delivery time.|A|
|FR-033|Checkout shall apply a nationwide delivery fee of PKR 200,<br>configurable by the owner.|A|
|FR-034|Launch payment shall support COD and manual Easypaisa transfer.<br>Other methods are deferred.|B|
|FR-035|The system shall record payment status (Awaiting Payment, Paid,<br>Rejected, Refunded) and shall not treat unverified payment as paid.|B|
|FR-036|The system shall automatically calculate the order-value discount.|B|
|FR-037|The system shall support discount codes.|B|
|FR-038|Discount codes shall be combinable with the automatic discount.|B|
|FR-039|Checkout shall display subtotal, discounts, delivery and final payable|A|



|ID|Requirement|Phase|
|---|---|---|
||amount.||
|FR-040|The system shall create orders automatically after successful checkout.|B|
|FR-041|The system shall not require owner approval of every order.|B|
|FR-042|The system shall show order confirmation on the website.|B|
|FR-043|The system shall send order confirmation by email.|B|
|FR-044|The system shall provide a Veigin tracking page.|C|
|FR-045|The tracking page shall show the tracking ID and status timeline, plus<br>courier data when available.|C|
|FR-046|The system shall support cancellation requests within 24 hours, auto-<br>approved if the order is undispatched and otherwise routed to the<br>owner.|B|
|FR-047|Cancellation requests shall require a reason.|B|
|FR-048|The administrator shall be able to review cancellation requests.|B|
|FR-049|The system shall not accept change-of-mind returns.|B|
|FR-050|The system shall support replacement requests within 7 days of<br>delivery and reject later requests.|B|
|FR-051|The system shall support refund handling for damaged products, with<br>photo or video evidence required.|B|
|FR-052|The system shall provide public product reviews.|D|
|FR-053|Reviews shall support star ratings, text and images.|D|
|FR-054|Reviews shall not require routine approval before publication.|D|
|FR-055|The system shall support customer registration and login.|D|
|FR-056|Registration shall not be required to place an order.|A|
|FR-057|The system shall track cumulative spending for registered customers.|D|
|FR-058|The system shall support configurable loyalty tiers and cards.|D|
|FR-059|Discord account linking.|Deferred|
|FR-060|Discord role synchronization.|Deferred|
|FR-061<br>FR-062|The system shall provide a responsive administrator dashboard.<br>The administrator shall manage products, orders, inventory,|B<br>B|



|ID|Requirement|Phase|
|---|---|---|
||customers, drops, discounts, reviews and settings.||
|FR-063|The administrator shall manage cancellation, replacement and refund<br>requests.|B|
|FR-064|The website shall support desktop, tablet and mobile.|A|
|FR-065|The system shall support configurable store content and promotional<br>sections.|B|
|FR-066|The system shall hold stock for manual-payment orders for a<br>configurable window and release it on expiry.|B|
|FR-067|The administrator shall be able to verify or reject submitted payment<br>proof.|B|
|FR-068|Guests shall track orders using order ID plus phone number or email.|C|
|FR-069|The system shall allow at most one discount code per order.|B|
|FR-070|When reviews launch, the system shall support review reporting and<br>admin takedown, and limit reviews to verified buyers.|D|



## **26. Non-Functional Requirements** 

### **26.1 Performance** 

The site must load efficiently on typical Pakistani mobile connections: optimized image sizes and formats, lazy-loaded below-the-fold media, minimal scripts, light animation payloads, responsive cart and checkout, and no page blocking while media loads. Target metrics are set during technical planning and validated before launch. 

### **26.2 Responsive Design** 

All major customer-facing functions work on phones, tablets, laptops and desktops. The admin panel is also mobile-friendly. 

### **26.3 Security** 

HTTPS everywhere; secured customer data and administrator authentication; role-based access control; protection against unauthorized admin actions; input validation; protected file uploads; protected order and customer information. Payment-card details are never stored. 

### **26.4 Privacy and Legal** 

The site collects names, phone numbers, emails, delivery addresses and order history. A privacy policy and terms of service must be written and published before taking real orders. Promotional communication needs consent and an opt-out. 

### **26.5 Reliability** 

Orders, payment states, inventory changes and notifications must be processed reliably. Failed integrations must not silently leave an order in an incorrect payment or stock state. 

### **26.6 Maintainability** 

New product categories, drops, promotions, loyalty tiers and product types can be added without major restructuring. Hosting-specific features are kept out of core logic so the host can change. 

### **26.7 Accessibility** 

Readable text, adequate contrast, keyboard accessibility, accessible labels, usable touch targets and reduced-motion support. The visual style must not compromise essential usability. 

### **26.8 SEO** 

Search-friendly product pages with titles, descriptions, metadata and shareable links, and indexable public product pages. Detailed strategy is decided later. 

## **27. Technical Decisions** 

|Area|Decision|
|---|---|
|Frontend|Next.js with Tailwind|
|Backend and database|Managed database; specific provider to be chosen|
|Media storage|Cloudinary for images and video|
|Hosting|Vercel initially; may change later|
|Admin authentication|To be chosen; single owner role at launch|
|Payment|Provider interface with manual Easypaisa and COD<br>implementations at launch|
|Email|Provider to be chosen|



## **28. Key Workflows** 

### **28.1 Purchase** 

1. The customer visits the site and the entrance animation plays. 

2. The customer browses the scattered products, categories, search or drops. 

3. The customer opens a product and views media, name, price and details. 

4. The customer adds the item to the cart and reviews it. 

5. The customer proceeds to checkout and enters required information. 

6. The customer selects a payment method (COD or Easypaisa). 

7. Automatic discounts are calculated, a code is optionally applied, and the delivery fee is added. 

8. The customer reviews the final amount and submits the order. 

9. The system creates the order and deducts or holds stock. 

10. For Easypaisa, the customer submits payment proof and the owner verifies it. 

11. The customer receives confirmation, then tracks the order. 

12. The order is fulfilled and delivered. 

### **28.2 Scheduled Drop** 

1. The owner creates a drop and adds products. 

2. The owner sets details, prices, media and availability. 

3. The owner configures the release date and time. 

4. The drop stays unpublished until release. 

5. The system publishes it automatically at the scheduled time. 

6. Customers browse and buy according to stock and release rules. 

7. Exclusive products that sell out permanently move to the archive. 

### **28.3 Cancellation and Replacement** 

See sections 20 and 21. 

## **29. Acceptance Criteria** 

The launch release (Phases A to C and the drop and archive features) is ready when all of the following are demonstrated: 

- ☐ Homepage products display in the fixed scattered layout. 

- ☐ The entrance animation works correctly. 

- ☐ Products never appear upside down, sideways or overlapping. 

- ☐ Product name and price are accessible on desktop and mobile. 

- ☐ Search and category browsing work. 

- ☐ Product pages show the required media and information. 

- ☐ Materials are accurately disclosed. 

   - Cart operations work. 

- ☐ 

- ☐ Guest checkout works and collects required information. 

- ☐ Delivery fee and eligible discounts are calculated correctly, and code stacking works as configured. 

- ☐ COD checkout creates an order and deducts stock. 

- ☐ The Easypaisa manual flow works end to end, including proof submission, owner verification and auto-expiry with stock release. 

- ☐ Unpaid or rejected orders cannot be marked dispatched. 

- ☐ Two simultaneous buyers cannot purchase the last unit of a product. 

- ☐ Email confirmation is sent only for successfully created orders. 

- ☐ The tracking page shows the timeline for an order using ID plus phone or email. 

- ☐ Cancellation requests follow the auto-approve or owner-review rule. 

- ☐ Replacement requests after 7 days from delivery are rejected. 

- ☐ Damaged-item refund requests with evidence can be submitted and managed. 

- ☐ Drops can be scheduled and published automatically. 

- ☐ Exclusive products can be archived and are not purchasable. 

- ☐ The admin can change the delivery fee, discount values and discount codes without a developer. 

- ☐ Admin functions work on mobile and desktop. 

- ☐ A privacy policy and terms of service are published. 

- ☐ Security and privacy checks are completed. 

- ☐ The website is tested on common mobile and desktop browsers. 

Phase D adds acceptance checks for accounts, reviews, spend tracking and loyalty tiers when it is scheduled. 

## **30. Remaining Open Items** 

These do not block starting development but need answers before launch: 

- Courier company, and whether it offers an API 

- Merchant account status and gateway provider 

- Easypaisa account number and title to display 

- Email provider and admin authentication method 

- Privacy policy and terms of service text 

- Loyalty tier names, thresholds and perks (Phase D) 

- Fonts, logo assets, scatter coordinates, tilt values, animation timings and the mobile reveal interaction 

- Backup strategy and analytics tools 

## **31. Development Phases** 

### **Phase A: Core storefront** 

Brand design system, homepage, catalog, product pages, search, categories, cart, guest checkout. 

### **Phase B: Commerce infrastructure** 

COD and manual Easypaisa payment, discount engine, order management, inventory, email notifications, cancellation and replacement workflows, admin dashboard. 

### **Phase C: Delivery** 

Tracking page and order status timeline, with courier API integration when a courier is chosen. 

### **Phase D: Community** 

Customer accounts, reviews, loyalty tiers and cards. 

### **Phase E: Brand experience** 

Scheduled drops, exclusive products, the Fallen Soldiers archive and refined motion. Scheduled drops and the archive are part of the launch release; if the schedule is tight, they can ship immediately after the core store. 

## **32. Final Project Definition** 

Veigin is a single-brand, dark editorial e-commerce platform for gothic and alternative jewellery and accessories in Pakistan. It combines an art-directed scattered-product homepage with a falling entrance animation, a gothic and brutalist visual identity, product transparency, streamlined guest checkout, COD and manual Easypaisa payment, nationwide delivery, automatic promotions, on-site order tracking, scheduled product drops and an exclusive product archive. Reviews, loyalty and community features follow once the store is trading. 

The site is meant to do more than sell products. It should establish Veigin as a recognizable brand with its own identity, exclusivity and returning customers. 

**Initial milestone: at least 50 orders, positive customer experience and the first repeat purchases.** 

#### **End of SRS, Version 1.1** 

