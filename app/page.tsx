import { Suspense } from "react";
import Link from "next/link";
import { getHomeProducts } from "@/lib/products";
import ScatterField from "@/components/ScatterField";

async function HomeContent() {
  const products = await getHomeProducts();
  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-10">
      <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-12">
        <div>
          <h1 className="font-blackletter text-5xl leading-tight text-bone sm:text-6xl">
            Wear <span className="text-crimson-bright">the dark.</span>
          </h1>
          <p className="mt-4 font-mono text-sm uppercase tracking-[0.18em] text-silver">
            Alternative fashion. Reimagined in Pakistan.
          </p>
          <Link
            href="/products"
            className="mt-8 inline-flex items-center gap-3 border border-bone px-6 py-3 font-display text-sm uppercase tracking-[0.14em] text-bone transition-colors hover:bg-bone hover:text-page focus-visible:bg-bone focus-visible:text-page"
          >
            Explore the collection
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="square"
              aria-hidden="true"
              className="size-4"
            >
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
          {products.length === 0 && (
            <p className="mt-6 font-mono text-xs text-silver">
              No products available yet.
            </p>
          )}
        </div>
        <ScatterField products={products} />
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1400px] px-4 py-10" />}>
      <HomeContent />
    </Suspense>
  );
}