"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import type { Product, ProductMedia } from "@/lib/products";

type Props = {
  product: Product;
  index: number;
};

function isRealUrl(url: string): boolean {
  return /^https?:\/\//i.test(url) || url.startsWith("/");
}

function MediaFrame({ media, name }: { media: ProductMedia[]; name: string }) {
  const first = media[0];
  if (first && isRealUrl(first.url)) {
    if (first.type === "video") {
      return (
        <video
          src={first.url}
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
          aria-label={first.alt ?? name}
        />
      );
    }
    return (
      <img
        src={first.url}
        alt={first.alt ?? name}
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
      />
    );
  }
  return (
    <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] uppercase tracking-[0.3em] text-silver/50">
      PHOTO
    </span>
  );
}

export default function ProductCard({ product, index }: Props) {
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState(false);

  return (
    <motion.article
      className="group relative"
      suppressHydrationWarning
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      animate={{
        y: hovered ? -4 : 0,
        scale: hovered ? 1.01 : 1,
      }}
      transition={
        reduced
          ? { duration: 0 }
          : { type: "spring", stiffness: 300, damping: 25 }
      }
    >
      <Link
        href={`/products/${product.slug}`}
        className="block focus:outline-none"
      >
        <div
          className={`relative rounded-none border bg-panel transition-colors duration-200 ${
            hovered ? "border-accent" : "border-border"
          }`}
          style={{ aspectRatio: "3 / 4" }}
        >
          {/* crimson corner tab */}
          <span
            className="absolute right-0 top-0 z-10 block h-3 w-3 bg-accent"
            aria-hidden="true"
          />
          <MediaFrame media={product.media} name={product.name} />
        </div>

        <div className="mt-3">
          <h3 className="font-display font-medium text-lg leading-tight text-foreground">
            {product.name}
          </h3>
          <div className="mt-1 flex items-baseline justify-between gap-2">
            <span className="font-price text-lg text-accent">
              PKR {product.price.toLocaleString("en-PK")}
            </span>
            {product.compareAtPrice != null && product.compareAtPrice > product.price && (
              <span className="font-display text-xs text-muted line-through">
                PKR {product.compareAtPrice.toLocaleString("en-PK")}
              </span>
            )}
          </div>
          <p className="mt-1 font-poppins text-[10px] uppercase tracking-[0.18em] text-muted">
            {product.categoryName ?? "Uncategorised"}
            {product.material ? ` · ${product.material}` : ""}
            {product.lengthLabel ? ` · ${product.lengthLabel}` : ""}
          </p>
        </div>
      </Link>
    </motion.article>
  );
}