import Link from "next/link";
import type { ReactNode } from "react";
import Logo from "@/components/Logo";
import MobileMenu from "@/components/MobileMenu";
import { IconSearch, IconUser } from "@/components/icons";
import CartBadge from "@/components/CartBadge";
import { primaryNav, secondaryNav, utilityNav } from "@/lib/nav";
import type { NavLink } from "@/lib/nav";

function NavItem({ label, href, accent }: NavLink) {
  const isTrackOrder = label.toLowerCase() === "track order";

  return (
    <Link
      href={href}
      className={`font-poppins text-[12px] font-normal uppercase tracking-[0.04em] whitespace-nowrap transition-colors ${
        isTrackOrder
          ? "rounded-full bg-accent px-2 py-1 text-white hover:bg-accent/80 hover:text-white"
          : `${accent ? "text-accent" : "text-foreground"} hover:text-accent`
      }`}
    >
      {label}
    </Link>
  );
}

function IconButton({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="flex size-7 items-center justify-center text-foreground xl:size-8 transition-colors hover:text-accent"
    >
      {children}
    </Link>
  );
}

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto hidden h-16 max-w-[1400px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-4 lg:grid xl:gap-2">
        <nav
          aria-label="Primary"
          className="flex items-center gap-2 justify-self-start"
        >
          {primaryNav.map((link) => (
            <NavItem key={link.href} {...link} />
          ))}
        </nav>

        <Link
          href="/"
          aria-label="Veigin home"
          className="justify-self-center"
        >
          <Logo className="h-7 w-auto xl:h-8" priority />
        </Link>

        <div className="flex items-center gap-2 justify-self-end xl:gap-3 xl:translate-x-3">
          <nav
            aria-label="Collections"
            className="flex items-center gap-2"
          >
            {secondaryNav.map((link) => (
              <NavItem key={link.href} {...link} />
            ))}
          </nav>

          <nav
            aria-label="Account and help"
            className="hidden items-center gap-2 2xl:flex"
          >
            {utilityNav.map((link) => (
              <NavItem key={link.href} {...link} />
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <IconButton href="/search" label="Search">
              <IconSearch />
            </IconButton>
            <IconButton href="/account" label="Account">
              <IconUser />
            </IconButton>
            <CartBadge />
          </div>
        </div>
      </div>

      <MobileMenu />
    </header>
  );
}