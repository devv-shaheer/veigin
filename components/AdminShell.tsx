"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import {
  IconBag,
  IconUser,
  IconSearch,
  IconMenu,
  IconClose,
} from "@/components/icons";

/* ============================================================
   AdminShell — Clean Commerce Dashboard Layout Wrapper
   ============================================================ */

interface NavItem {
  href: string;
  label: string;
  icon: React.FC<{ className?: string }>;
  disabled?: boolean;
  comingSoon?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/admin", label: "Overview", icon: IconSearch },
  { href: "/admin/products", label: "Products", icon: IconBag },
  {
    href: "#",
    label: "Inventory",
    icon: IconBag,
    disabled: true,
    comingSoon: true,
  },
  {
    href: "#",
    label: "Orders",
    icon: IconUser,
    disabled: true,
    comingSoon: true,
  },
  {
    href: "#",
    label: "Customers",
    icon: IconUser,
    disabled: true,
    comingSoon: true,
  },
  {
    href: "#",
    label: "Discounts",
    icon: IconSearch,
    disabled: true,
    comingSoon: true,
  },
  {
    href: "#",
    label: "Storefront",
    icon: IconSearch,
    disabled: true,
    comingSoon: true,
  },
  {
    href: "#",
    label: "Settings",
    icon: IconMenu,
    disabled: true,
    comingSoon: true,
  },
];

interface AdminShellProps {
  children: React.ReactNode;
  pageTitle?: string;
  userEmail?: string;
}

export default function AdminShell({
  children,
  pageTitle = "Overview",
  userEmail = "admin@veigin.pk",
}: AdminShellProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Determine active nav item based on current pathname
  const getActiveHref = (href: string) => {
    if (href === "#") return false;
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <div className="admin-shell">
      {/* Mobile overlay */}
      <div
        className={`admin-shell__overlay ${sidebarOpen ? "admin-shell__overlay--open" : ""}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside className={`admin-shell__sidebar ${sidebarOpen ? "admin-shell__sidebar--open" : ""}`} role="navigation" aria-label="Admin navigation">
        {/* Brand */}
        <div className="admin-shell__sidebar-brand">
          <Link href="/admin" className="block" aria-label="VEIGIN Admin Home">
            <svg
              className="admin-shell__sidebar-logo"
              viewBox="0 0 120 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <text
                x="0"
                y="24"
                fontFamily="Georgia, serif"
                fontSize="24"
                fontWeight="400"
                letterSpacing="0.02em"
                fill="currentColor"
                style={{ opacity: 0.7 }}
              >
                VEIGIN
              </text>
            </svg>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="admin-shell__sidebar-nav">
          <div className="admin-shell__nav-section">
            <div className="admin-shell__nav-section-title">Main</div>
            {NAV_ITEMS.slice(0, 2).map((item) => {
              const isActive = getActiveHref(item.href);
              if (item.disabled) {
                return (
                  <span
                    key={item.href}
                    className={`admin-shell__nav-item admin-shell__nav-item--disabled ${
                      isActive ? "admin-shell__nav-item--active" : ""
                    }`}
                    aria-current={isActive ? "page" : undefined}
                    aria-disabled="true"
                  >
                    <item.icon className="admin-shell__nav-icon" aria-hidden="true" />
                    <span>{item.label}</span>
                    {item.comingSoon && (
                      <span
                        className="ml-auto text-[10px] font-medium text-crimson-bright uppercase tracking-wider"
                        style={{ color: "var(--admin-crimson)" }}
                      >
                        Soon
                      </span>
                    )}
                  </span>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`admin-shell__nav-item ${
                    isActive ? "admin-shell__nav-item--active" : ""
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <item.icon className="admin-shell__nav-icon" aria-hidden="true" />
                  <span>{item.label}</span>
                  {item.comingSoon && (
                    <span
                      className="ml-auto text-[10px] font-medium text-crimson-bright uppercase tracking-wider"
                      style={{ color: "var(--admin-crimson)" }}
                    >
                      Soon
                    </span>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="admin-shell__nav-section">
            <div className="admin-shell__nav-section-title">Coming Soon</div>
            {NAV_ITEMS.slice(2).map((item) => {
              if (item.disabled) {
                return (
                  <span
                    key={item.href}
                    className="admin-shell__nav-item admin-shell__nav-item--disabled"
                    aria-disabled="true"
                  >
                    <item.icon className="admin-shell__nav-icon" aria-hidden="true" />
                    <span>{item.label}</span>
                    <span
                      className="ml-auto text-[10px] font-medium text-crimson-bright uppercase tracking-wider"
                      style={{ color: "var(--admin-crimson)" }}
                    >
                      Soon
                    </span>
                  </span>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="admin-shell__nav-item"
                >
                  <item.icon className="admin-shell__nav-icon" aria-hidden="true" />
                  <span>{item.label}</span>
                  <span
                    className="ml-auto text-[10px] font-medium text-crimson-bright uppercase tracking-wider"
                    style={{ color: "var(--admin-crimson)" }}
                  >
                    Soon
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Footer - Logout */}
        <div className="admin-shell__sidebar-footer">
          <form action="/api/admin/logout" method="POST">
            <button
              type="submit"
              className="admin-shell__nav-item admin-shell__nav-item--ghost w-full justify-start"
              style={{ padding: "var(--space-2) var(--space-3)" }}
            >
              <IconClose className="admin-shell__nav-icon" aria-hidden="true" />
              <span>Log out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="admin-shell__main">
        {/* Top header */}
        <header className="admin-shell__header">
          <div className="flex items-center gap-4">
            <button
              className="admin-shell__mobile-toggle"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={sidebarOpen}
            >
              <IconMenu className="size-6" aria-hidden="true" />
            </button>
            <h1 className="admin-shell__header-title">{pageTitle}</h1>
          </div>
          <div className="admin-shell__header-user">
            <div className="admin-shell__user-info">
              <span className="admin-shell__user-label">Signed in as</span>
              <span className="admin-shell__user-email">{userEmail}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="admin-shell__content">{children}</div>
      </main>
    </div>
  );
}