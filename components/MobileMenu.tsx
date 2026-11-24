"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import { IconBag, IconClose, IconMenu } from "@/components/icons";
import { primaryNav, secondaryNav, utilityNav } from "@/lib/nav";
import type { NavLink } from "@/lib/nav";

function MenuLink({
  label,
  href,
  accent,
  onNavigate,
}: NavLink & { onNavigate: () => void }) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`block py-2 font-mono text-sm uppercase tracking-[0.14em] ${
        accent ? "text-crimson" : "text-bone"
      }`}
    >
      {label}
    </Link>
  );
}

function Group({ title, links, onNavigate }: { title: string; links: NavLink[]; onNavigate: () => void }) {
  return (
    <div>
      <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-silver">
        {title}
      </h2>
      <ul className="mt-2 flex flex-col">
        {links.map((link) => (
          <li key={link.href}>
            <MenuLink {...link} onNavigate={onNavigate} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 lg:hidden">
        <button
          type="button"
          aria-label="Open menu"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen(true)}
          className="flex size-9 items-center justify-center text-bone"
        >
          <IconMenu />
        </button>
        <Link href="/" aria-label="Veigin home">
          <Logo className="h-7 w-auto" />
        </Link>
        <Link
          href="/cart"
          aria-label="Cart"
          className="flex size-9 items-center justify-center text-bone"
        >
          <IconBag />
        </Link>
      </div>

      <div
        className={`fixed inset-0 z-50 lg:hidden ${open ? "" : "pointer-events-none"}`}
        aria-hidden={!open}
        inert={!open}
      >
        <button
          type="button"
          aria-label="Close menu"
          tabIndex={-1}
          onClick={close}
          className={`absolute inset-0 bg-page/80 transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
        />
        <div
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className={`absolute left-0 top-0 flex h-full w-80 max-w-[85vw] flex-col overflow-y-auto border-r border-silver/15 bg-panel transition-transform duration-300 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between border-b border-silver/15 px-4 py-3">
            <Logo className="h-7 w-auto" />
            <button
              type="button"
              aria-label="Close menu"
              onClick={close}
              className="flex size-9 items-center justify-center text-bone"
            >
              <IconClose />
            </button>
          </div>
          <nav aria-label="Mobile" className="flex flex-col gap-6 px-4 py-6">
            <Group title="Shop" links={primaryNav} onNavigate={close} />
            <Group
              title="Discover"
              links={[
                ...secondaryNav,
                { label: "The Fallen Soldiers", href: "/archive" },
              ]}
              onNavigate={close}
            />
            <Group
              title="Help"
              links={[
                { label: "Search", href: "/search" },
                ...utilityNav,
                { label: "Account", href: "/account" },
              ]}
              onNavigate={close}
            />
          </nav>
        </div>
      </div>
    </>
  );
}