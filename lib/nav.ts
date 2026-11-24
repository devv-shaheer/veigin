export type NavLink = {
  label: string;
  href: string;
  accent?: boolean;
};

export type FooterColumn = {
  title: string;
  links: NavLink[];
};

export const primaryNav: NavLink[] = [
  { label: "All Products", href: "/products" },
  { label: "Rings", href: "/category/rings" },
  { label: "Bracelets", href: "/category/bracelets" },
  { label: "Necklaces", href: "/category/necklaces" },
];

export const secondaryNav: NavLink[] = [
  { label: "Best Sellers", href: "/best-sellers" },
  { label: "New Drops", href: "/new-drops" },
  { label: "Exclusive", href: "/exclusive" },
  { label: "Sales", href: "/sales", accent: true },
];

export const utilityNav: NavLink[] = [
  { label: "Track Order", href: "/track" },
  { label: "Support", href: "/support" },
];

export const footerColumns: FooterColumn[] = [
  { title: "Shop", links: primaryNav },
  {
    title: "Discover",
    links: [...secondaryNav, { label: "The Fallen Soldiers", href: "/archive" }],
  },
  {
    title: "Support",
    links: [
      { label: "Track Order", href: "/track" },
      { label: "Support", href: "/support" },
      { label: "Shipping & Delivery", href: "/shipping" },
      { label: "Returns & Refunds", href: "/returns" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
    ],
  },
];