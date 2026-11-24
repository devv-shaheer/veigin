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
      className={`font-mono text-[11px] uppercase tracking-[0.06em] whitespace-nowrap ${
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
      className="flex size-7 items-center justify-center text-bone xl:size-8"
    >
      {children}
    </Link>
  );
}

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-silver/15 bg-page">
      <div className="mx-auto hidden h-16 max-w-[1400px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-4 lg:grid xl:gap-4">
        <nav
          aria-label="Primary"
          className="flex items-center gap-3 justify-self-start"
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

        <div className="flex items-center gap-3 justify-self-end xl:gap-4">
          <nav aria-label="Collections" className="flex items-center gap-3">
            {secondaryNav.map((link) => (
              <NavItem key={link.href} {...link} />
            ))}
          </nav>

          <nav
            aria-label="Account and help"
            className="hidden items-center gap-3 2xl:flex"
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