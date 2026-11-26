import ProductCard from "@/components/ProductCard";
import { getAllProducts } from "@/lib/products";
import type { ProductFilters } from "@/lib/products";

export default async function ProductsView({
  title,
  filters = {},
}: {
  title: string;
  filters?: ProductFilters;
}) {
  const products = await getAllProducts(filters);
  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-10">
      <div className="mb-8 flex items-end justify-between gap-4">
        <h1 className="font-display font-light text-4xl leading-tight text-foreground sm:text-5xl">
          {title}
        </h1>
        <p className="font-mono text-xs uppercase tracking-[0.18em] text-muted">
          {products.length} {products.length === 1 ? "piece" : "pieces"}
        </p>
      </div>
      {products.length === 0 ? (
        <p className="font-poppins text-sm text-muted">No products found.</p>
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