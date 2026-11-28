import { Suspense } from "react";
import ProductsView from "@/components/ProductsView";

export default function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1400px] px-4 py-10" />}>
      <ProductsContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ProductsContent({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const sp = await searchParams;
  const title = sp.category
    ? sp.category.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "All Products";
  return <ProductsView title={title} filters={{ categorySlug: sp.category }} />;
}