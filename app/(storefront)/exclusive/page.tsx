import { Suspense } from "react";
import ProductsView from "@/components/ProductsView";

export default function ExclusivePage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1400px] px-4 py-10" />}>
      <ProductsView title="Exclusive" filters={{ exclusive: true }} />
    </Suspense>
  );
}