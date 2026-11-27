import { Suspense } from "react";
import { searchProducts } from "@/lib/products";
import ProductCard from "@/components/ProductCard";

export default function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1400px] px-4 py-10" />}>
      <SearchContent searchParams={searchParams} />
    </Suspense>
  );
}

async function SearchContent({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const sp = await searchParams;
  const q = sp.q ?? "";
  const products = q ? await searchProducts(q) : [];
  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-10">
      <h1 className="font-heading text-4xl sm:text-5xl">
        Search{q ? `: ${q}` : ""}
      </h1>
      {products.length === 0 ? (
        <p className="mt-6 font-mono text-sm text-silver">
          {q ? "No products found." : "Enter a search term."}
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      )}
    </main>
  );
}