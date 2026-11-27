import Link from "next/link";

export default function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-10">
      <h1 className="font-heading text-5xl tracking-[0.03em] sm:text-6xl">Order placed<span className="text-accent" aria-hidden="true">.</span></h1>
      <p className="mt-4 font-mono text-sm text-silver">
        Thank you. Your order has been received and will be delivered within 2-5 working days.
      </p>
      <Link
        href="/products"
        className="mt-8 inline-block border border-bone px-6 py-3 font-display text-sm uppercase tracking-[0.14em] text-bone hover:bg-bone hover:text-page"
      >
        Continue shopping
      </Link>
    </main>
  );
}