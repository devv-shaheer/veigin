import { Suspense } from "react";
import { getAllProducts } from "@/lib/products";
import ProductCard from "@/components/ProductCard";

type SearchParams = {
  category?: string;
};

async function ProductList({ category }: { category?: string }) {
  const products = await getAllProducts(category);
  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-10">
      <div className="mb-8 flex items-end justify-between gap-4">
        <h1 className="font-blackletter text-4xl text-bone sm:text-5xl">
          {category ? category.replace(/-/g, " ") : "All Products"}
        </h1>
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-silver">
          {products.length} {products.length === 1 ? "piece" : "pieces"}
        </p>
      </div>

      {products.length === 0 ? (
        <p className="font-mono text-sm text-silver">No products found.</p>
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((p, i) => (
            <ProductCard key={p.id} product={p} index={i} />
          ))}
        </div>
      )}
    </main>
  );
}

export default function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1400px] px-4 py-10" />}>
      <ProductListWrapper searchParams={searchParams} />
    </Suspense>
  );
}

async function ProductListWrapper({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  return <ProductList category={sp.category} />;
}