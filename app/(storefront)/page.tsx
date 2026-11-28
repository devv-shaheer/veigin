import { Suspense } from "react";
import { getHomeProducts } from "@/lib/products";
import ScatterField from "@/components/ScatterField";
import ExploreButton from "@/components/ExploreButton";

async function HomeContent() {
  const products = await getHomeProducts();
  return (
    <main className="mx-auto w-full max-w-[1400px] px-4">
      <div className="relative min-h-[calc(100vh-4rem)] flex items-center">
        <div className="grid gap-8 lg:grid-cols-[1fr_55%] lg:items-center lg:gap-12 w-full">
          <div className="z-10">
            <h1 className="font-heading text-5xl leading-tight text-foreground sm:text-6xl">
              WEAR <span className="font-heading text-accent">the dark.</span>
            </h1>
            <p className="mt-4 font-display font-medium text-sm uppercase tracking-[0.2em] text-muted">
              GOTHIC HERO. DARK BY DESIGN.
            </p>
            <ExploreButton />
            {products.length === 0 && (
              <p className="mt-6 font-display text-xs text-muted">
                No products available yet.
              </p>
            )}
          </div>
          <div className="lg:col-start-2">
            <ScatterField products={products} />
          </div>
        </div>
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1400px] px-4 min-h-[calc(100vh-4rem)] flex items-center" />}>
      <HomeContent />
    </Suspense>
  );
}