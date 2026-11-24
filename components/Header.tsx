import Link from "next/link";
import type { ReactNode } from "react";
import Logo from "@/components/Logo";
import MobileMenu from "@/components/MobileMenu";
import { IconBag, IconSearch, IconUser } from "@/components/icons";
import { primaryNav, secondaryNav, utilityNav } from "@/lib/nav";
import type { NavLink } from "@/lib/nav";

function NavItem({ label, href, accent }: NavLink) {
  return (
    <Link
      href={href}
      className={`font-mono text-[11px] uppercase tracking-[0.14em] whitespace-nowrap ${
        accent ? "text-crimson" : "text-bone"
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
      className="flex size-9 items-center justify-center text-bone"
    >
      {children}
    </Link>
  );
}

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-silver/15 bg-page">
      <div className="mx-auto hidden h-16 max-w-[1400px] grid-cols-[1fr_auto_1fr] items-center gap-6 px-4 lg:grid">
        <nav
          aria-label="Primary"
          className="flex items-center gap-5 justify-self-start"
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
          <Logo className="h-8 w-auto" priority />
        </Link>

        <div className="flex items-center gap-4 justify-self-end">
          <nav
            aria-label="Collections"
            className="flex items-center gap-5"
          >
            {secondaryNav.map((link) => (
              <NavItem key={link.href} {...link} />
            ))}
          </nav>

          <span aria-hidden="true" className="h-4 w-px bg-silver/25" />

          <nav
            aria-label="Account and help"
            className="hidden items-center gap-4 xl:flex"
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
            <IconButton href="/cart" label="Cart">
              <IconBag />
            </IconButton>
          </div>
        </div>
      </div>

      <MobileMenu />
    </header>
  );
}