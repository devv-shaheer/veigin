"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import type { Product, ProductMedia } from "@/lib/products";

type Props = {
  product: Product;
  index: number;
};

const STAGGER = 0.03;

function isRealUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
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

  // Deterministic resting tilt/offset from product id + index.
  const seed = (product.id * 31 + index * 7) % 100;
  const restTilt = (seed % 7) - 3; // -3..+3 deg
  const restX = ((seed % 5) - 2) * 2; // -4..+4 px
  const restY = ((seed % 3) - 1) * 2; // -2..+2 px

  const rest = {
    rotate: restTilt,
    x: restX,
    y: restY,
    scale: 1,
  };
  const active = {
    rotate: 0,
    x: 0,
    y: -4,
    scale: 1.02,
  };

  const target = reduced ? { rotate: 0, x: 0, y: 0, scale: 1 } : hovered ? active : rest;

  return (
    <motion.article
      className="group relative"
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      initial={reduced ? { rotate: 0, x: 0, y: 0, scale: 1 } : rest}
      animate={target}
      transition={
        reduced
          ? { duration: 0 }
          : { type: "spring", stiffness: 120, damping: 18, mass: 0.6 }
      }
    >
      <Link
        href={`/products/${product.slug}`}
        className="block focus:outline-none"
      >
        <div
          className={`relative rounded-none border bg-panel transition-colors duration-200 ${
            hovered ? "border-crimson" : "border-silver/30"
          }`}
          style={{ aspectRatio: "3 / 4" }}
        >
          {/* crimson corner tab */}
          <span
            className="absolute right-0 top-0 z-10 block h-3 w-3 bg-crimson"
            aria-hidden="true"
          />
          <MediaFrame media={product.media} name={product.name} />
        </div>

        <div className="mt-3">
          <h3 className="font-blackletter text-2xl leading-tight text-bone">
            {product.name}
          </h3>
          <div className="mt-1 flex items-baseline justify-between gap-2">
            <span className="font-display text-lg text-crimson-bright">
              PKR {product.price.toLocaleString("en-PK")}
            </span>
            {product.compareAtPrice != null && product.compareAtPrice > product.price && (
              <span className="font-mono text-xs text-silver line-through">
                PKR {product.compareAtPrice.toLocaleString("en-PK")}
              </span>
            )}
          </div>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-silver">
            {product.categoryName ?? "Uncategorised"}
            {product.material ? ` · ${product.material}` : ""}
            {product.lengthLabel ? ` · ${product.lengthLabel}` : ""}
          </p>
        </div>
      </Link>
    </motion.article>
  );
}