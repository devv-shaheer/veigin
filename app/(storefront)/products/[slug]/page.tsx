import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/products";
import ProductDetail from "@/components/ProductDetail";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-[1400px] px-4 py-10" />}>
      <DetailContent params={params} />
    </Suspense>
  );
}

async function DetailContent({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  return <ProductDetail product={product} />;
}