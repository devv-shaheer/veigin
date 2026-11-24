"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const router = useRouter();
  const deliveryFee = 200;

  const [form, setForm] = useState({
    customerName: "",
    phone: "",
    email: "",
    promoConsent: false,
    address: "",
    city: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (k: keyof typeof form, v: string | boolean) =>
    setForm((f) => ({ ...f, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.customerName,
          phone: form.phone,
          email: form.email,
          promoConsent: form.promoConsent,
          address: form.address,
          city: form.city,
          items: items.map((i) => ({
            productId: i.productId,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Order failed");
      clear();
      router.push(`/checkout/success?order=${data.orderId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <main className="mx-auto w-full max-w-[1400px] px-4 py-10">
        <h1 className="font-blackletter text-4xl text-bone sm:text-5xl">Checkout</h1>
        <p className="mt-6 font-mono text-sm text-silver">Your cart is empty.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-10">
      <h1 className="font-blackletter text-4xl text-bone sm:text-5xl">Checkout</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block font-mono text-[11px] uppercase tracking-[0.18em] text-silver">
              Full name
            </label>
            <input
              required
              value={form.customerName}
              onChange={(e) => update("customerName", e.target.value)}
              className="mt-1 w-full border border-silver/30 bg-panel px-4 py-2 font-mono text-sm text-bone focus:border-crimson focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-mono text-[11px] uppercase tracking-[0.18em] text-silver">
              Contact number
            </label>
            <input
              required
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              className="mt-1 w-full border border-silver/30 bg-panel px-4 py-2 font-mono text-sm text-bone focus:border-crimson focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-mono text-[11px] uppercase tracking-[0.18em] text-silver">
              Email
            </label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              className="mt-1 w-full border border-silver/30 bg-panel px-4 py-2 font-mono text-sm text-bone focus:border-crimson focus:outline-none"
            />
          </div>
          <label className="flex items-center gap-2 font-mono text-xs text-silver">
            <input
              type="checkbox"
              checked={form.promoConsent}
              onChange={(e) => update("promoConsent", e.target.checked)}
              className="accent-crimson"
            />
            Send me promotional emails and updates.
          </label>
          <div>
            <label className="block font-mono text-[11px] uppercase tracking-[0.18em] text-silver">
              Full delivery address
            </label>
            <textarea
              required
              value={form.address}
              onChange={(e) => update("address", e.target.value)}
              rows={3}
              className="mt-1 w-full border border-silver/30 bg-panel px-4 py-2 font-mono text-sm text-bone focus:border-crimson focus:outline-none"
            />
          </div>
          <div>
            <label className="block font-mono text-[11px] uppercase tracking-[0.18em] text-silver">
              City
            </label>
            <input
              required
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              className="mt-1 w-full border border-silver/30 bg-panel px-4 py-2 font-mono text-sm text-bone focus:border-crimson focus:outline-none"
            />
          </div>

          {error && (
            <p className="font-mono text-xs text-crimson-bright">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full border border-bone px-6 py-3 font-display text-sm uppercase tracking-[0.14em] text-bone transition-colors hover:bg-bone hover:text-page disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Placing order..." : "Place order (COD)"}
          </button>
        </form>

        <aside className="h-fit border border-silver/15 bg-panel p-6">
          <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-silver">
            Order summary
          </h2>
          <ul className="mt-4 space-y-2">
            {items.map((i) => (
              <li key={i.productId} className="flex justify-between font-mono text-xs text-bone">
                <span>
                  {i.name} × {i.quantity}
                </span>
                <span>PKR {(i.price * i.quantity).toLocaleString("en-PK")}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-2 border-t border-silver/15 pt-4 font-mono text-sm">
            <div className="flex justify-between text-bone">
              <span>Subtotal</span>
              <span>PKR {subtotal.toLocaleString("en-PK")}</span>
            </div>
            <div className="flex justify-between text-bone">
              <span>Delivery (2-5 working days)</span>
              <span>PKR {deliveryFee.toLocaleString("en-PK")}</span>
            </div>
            <div className="flex justify-between border-t border-silver/15 pt-2 font-display text-base text-crimson-bright">
              <span>Total</span>
              <span>PKR {(subtotal + deliveryFee).toLocaleString("en-PK")}</span>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}