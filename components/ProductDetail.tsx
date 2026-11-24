"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { useCart } from "@/components/CartProvider";
import type { Product } from "@/lib/products";

function isRealUrl(url: string): boolean {
  return /^https?:\/\//i.test(url) || url.startsWith("/");
}

export default function ProductDetail({ product }: { product: Product }) {
  const reduced = useReducedMotion();
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);

  const safeStock = Number.isFinite(product.stock) && product.stock > 0 ? product.stock : 0;

  const outOfStock =
    safeStock <= 0 ||
    product.availability === "sold_out" ||
    product.availability === "archived";

  const canBuy = !outOfStock && product.availability !== "exclusive";

  const statusLabel =
    product.availability === "sold_out"
      ? "Sold Out"
      : product.availability === "archived"
        ? "Archived"
        : product.availability === "exclusive"
          ? "Exclusive"
          : safeStock <= 0
            ? "Sold Out"
            : "Available";

  const stockDisplay =
    product.stock == null || !Number.isFinite(product.stock)
      ? "—"
      : product.stock <= 0
        ? "Out of stock"
        : `${product.stock} in stock`;

  return (
    <main className="mx-auto w-full max-w-[1400px] px-4 py-10">
      <div className="grid gap-10 lg:grid-cols-2">
        {/* Media gallery */}
        <div className="relative rounded-none border border-silver/30 bg-panel" style={{ aspectRatio: "3 / 4" }}>
          {product.media.length > 0 && isRealUrl(product.media[0].url) ? (
            product.media[0].type === "video" ? (
              <video
                src={product.media[0].url}
                className="absolute inset-0 h-full w-full object-cover"
                muted
                loop
                playsInline
                controls
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.media[0].url}
                alt={product.media[0].alt ?? product.name}
                className="absolute inset-0 h-full w-full object-cover"
              />
            )
          ) : (
            <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] uppercase tracking-[0.3em] text-silver/50">
              PHOTO
            </span>
          )}
          <span className="absolute right-0 top-0 z-10 block h-3 w-3 bg-crimson" aria-hidden="true" />
        </div>

        {/* Info */}
        <div>
          <h1 className="font-blackletter text-5xl leading-tight text-bone sm:text-6xl">
            {product.name}
          </h1>

          <div className="mt-4 flex items-baseline gap-4">
            <span className="font-display text-3xl text-crimson-bright">
              PKR {product.price.toLocaleString("en-PK")}
            </span>
            {product.compareAtPrice != null && product.compareAtPrice > product.price && (
              <span className="font-mono text-sm text-silver line-through">
                PKR {product.compareAtPrice.toLocaleString("en-PK")}
              </span>
            )}
          </div>

          <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.18em] text-silver">
            Status: {statusLabel}
            {product.categoryName ? ` · ${product.categoryName}` : ""}
          </p>

          {product.description && (
            <p className="mt-6 font-mono text-sm leading-relaxed text-bone/80">
              {product.description}
            </p>
          )}

          {/* Specifications */}
          <div className="mt-6 space-y-2 border-t border-silver/15 pt-6">
            {product.material && (
              <div className="flex justify-between font-mono text-xs">
                <span className="text-silver">Material</span>
                <span className="text-bone">{product.material}</span>
              </div>
            )}
            {product.lengthLabel && (
              <div className="flex justify-between font-mono text-xs">
                <span className="text-silver">Length</span>
                <span className="text-bone">{product.lengthLabel}</span>
              </div>
            )}
            {product.buildDetails && (
              <div className="flex justify-between font-mono text-xs">
                <span className="text-silver">Build</span>
                <span className="text-bone">{product.buildDetails}</span>
              </div>
            )}
            <div className="flex justify-between font-mono text-xs">
              <span className="text-silver">Stock</span>
              <span className="text-bone">{stockDisplay}</span>
            </div>
          </div>

          {/* Add to cart */}
          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center border border-silver/30">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="px-4 py-2 font-mono text-sm text-bone hover:bg-silver/10"
                aria-label="Decrease quantity"
                disabled={!canBuy}
              >
                -
              </button>
              <span className="px-4 py-2 font-mono text-sm text-bone">{qty}</span>
              <button
                type="button"
                onClick={() =>
                  setQty((q) => Math.min(safeStock > 0 ? safeStock : 1, q + 1))
                }
                className="px-4 py-2 font-mono text-sm text-bone hover:bg-silver/10"
                aria-label="Increase quantity"
                disabled={!canBuy}
              >
                +
              </button>
            </div>

            <motion.button
              type="button"
              disabled={!canBuy}
              onClick={() => {
                if (!canBuy) return;
                addItem(product, qty);
              }}
              whileHover={reduced ? undefined : { scale: 1.02 }}
              whileTap={reduced ? undefined : { scale: 0.98 }}
              className={`flex-1 border px-6 py-3 font-display text-sm uppercase tracking-[0.14em] transition-colors ${
                canBuy
                  ? "border-bone bg-transparent text-bone hover:bg-bone hover:text-page"
                  : "cursor-not-allowed border-silver/30 text-silver/50"
              }`}
            >
              {canBuy ? "Add to Cart" : "Unavailable"}
            </motion.button>
          </div>

          {!canBuy && (
            <p className="mt-3 font-mono text-xs text-crimson-bright">
              This item is currently unavailable.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}