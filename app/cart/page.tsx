"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";

export default function CartPage() {
  const { items, removeItem, updateQty, subtotal, count } = useCart();
  const deliveryFee = 200;

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-10">
      <h1 className="font-blackletter text-4xl text-bone sm:text-5xl">Cart</h1>

      {items.length === 0 ? (
        <div className="mt-8">
          <p className="font-mono text-sm text-silver">Your cart is empty.</p>
          <Link
            href="/products"
            className="mt-4 inline-block border border-bone px-6 py-3 font-display text-sm uppercase tracking-[0.14em] text-bone hover:bg-bone hover:text-page"
          >
            Browse products
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <ul className="space-y-4">
            {items.map((i) => (
              <li
                key={i.productId}
                className="flex items-center gap-4 border border-silver/15 bg-panel p-4"
              >
                <div className="flex-1">
                  <Link
                    href={`/products/${i.slug}`}
                    className="font-blackletter text-xl text-bone hover:text-crimson-bright"
                  >
                    {i.name}
                  </Link>
                  <p className="font-display text-sm text-crimson-bright">
                    PKR {i.price.toLocaleString("en-PK")}
                  </p>
                </div>
                <div className="flex items-center border border-silver/30">
                  <button
                    type="button"
                    onClick={() => updateQty(i.productId, i.quantity - 1)}
                    className="px-3 py-1 font-mono text-sm text-bone hover:bg-silver/10"
                    aria-label="Decrease"
                  >
                    -
                  </button>
                  <span className="px-3 py-1 font-mono text-sm text-bone">{i.quantity}</span>
                  <button
                    type="button"
                    onClick={() => updateQty(i.productId, i.quantity + 1)}
                    className="px-3 py-1 font-mono text-sm text-bone hover:bg-silver/10"
                    aria-label="Increase"
                  >
                    +
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => removeItem(i.productId)}
                  className="font-mono text-xs uppercase tracking-[0.14em] text-silver hover:text-crimson-bright"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>

          <aside className="h-fit border border-silver/15 bg-panel p-6">
            <h2 className="font-mono text-[11px] uppercase tracking-[0.2em] text-silver">
              Summary
            </h2>
            <div className="mt-4 space-y-2 font-mono text-sm">
              <div className="flex justify-between text-bone">
                <span>Subtotal</span>
                <span>PKR {subtotal.toLocaleString("en-PK")}</span>
              </div>
              <div className="flex justify-between text-bone">
                <span>Delivery</span>
                <span>PKR {deliveryFee.toLocaleString("en-PK")}</span>
              </div>
              <div className="flex justify-between border-t border-silver/15 pt-2 font-display text-base text-crimson-bright">
                <span>Total</span>
                <span>PKR {(subtotal + deliveryFee).toLocaleString("en-PK")}</span>
              </div>
            </div>
            <Link
              href="/checkout"
              className="mt-6 block w-full border border-bone px-6 py-3 text-center font-display text-sm uppercase tracking-[0.14em] text-bone hover:bg-bone hover:text-page"
            >
              Checkout
            </Link>
            <p className="mt-3 font-mono text-[10px] text-silver">
              {count} {count === 1 ? "item" : "items"} · Estimated delivery 2-5 working days.
            </p>
          </aside>
        </div>
      )}
    </main>
  );
}