import Link from "next/link";
import Logo from "@/components/Logo";
import { footerColumns } from "@/lib/nav";

export default function Footer() {
  return (
    <footer className="border-t border-silver/15 bg-panel">
      <div className="mx-auto max-w-[1400px] px-4 py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <Link href="/" aria-label="Veigin home">
              <Logo className="h-8 w-auto" />
            </Link>
            <p className="mt-4 max-w-xs font-mono text-xs leading-relaxed text-silver">
              Gothic and alternative jewellery, forged for the dark at heart.
              Nationwide delivery across Pakistan.
            </p>
          </div>

          {footerColumns.map((column) => (
            <div key={column.title}>
              <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-silver">
                {column.title}
              </h2>
              <ul className="mt-4 space-y-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className={`font-mono text-sm ${
                        link.accent ? "text-crimson" : "text-bone"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-silver/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-xs text-silver">
            © Veigin. All rights reserved.
          </p>
          <p className="font-mono text-xs text-silver">
            Nationwide delivery · Cash on delivery available
          </p>
        </div>
      </div>
    </footer>
  );
}