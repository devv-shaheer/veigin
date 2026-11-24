"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  CARD_WIDTH_PCT,
  FIELD_ASPECT,
  displacedFor,
  type HomeProduct,
} from "@/lib/scatter";

type Props = {
  products: HomeProduct[];
};

const STAGGER = 0.04; // ~40ms per card

function ScatterCard({
  product,
  index,
  triggered,
  reduced,
}: {
  product: HomeProduct;
  index: number;
  triggered: boolean;
  reduced: boolean;
}) {
  const d = displacedFor(product.id, product.homeX, product.homeY);

  const [revealed, setRevealed] = useState(false);

  const home = {
    x: 0,
    y: 0,
    rotate: product.homeRot,
    xPercent: -50,
    yPercent: -50,
  };
  const scattered = {
    x: d.x,
    y: d.y,
    rotate: d.rot,
    xPercent: -50,
    yPercent: -50,
  };

  const initial = reduced ? home : scattered;
  const target = reduced ? home : triggered ? home : scattered;

  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const isTouch =
      typeof window !== "undefined" &&
      window.matchMedia("(hover: none)").matches;
    if (isTouch && !revealed) {
      e.preventDefault();
      setRevealed(true);
    }
  };

  return (
    <motion.a
      href={`/products/${product.slug}`}
      onClick={onClick}
      suppressHydrationWarning
      className="group absolute block focus:outline-none"
      style={{ left: `${product.homeX}%`, top: `${product.homeY}%`, width: `${CARD_WIDTH_PCT}%` }}
      initial={initial}
      animate={target}
      transition={
        reduced
          ? { duration: 0 }
          : { type: "spring", stiffness: 60, damping: 18, delay: triggered ? index * STAGGER : 0 }
      }
      whileHover={{ scale: 1.05 }}
      whileFocus={{ scale: 1.05 }}
    >
      <div
        className="relative rounded-none border border-silver/30 bg-panel"
        style={{ aspectRatio: "3 / 4" }}
      >
        {/* crimson corner tab */}
        <span
          className="absolute right-0 top-0 z-10 block h-3 w-3 bg-crimson"
          aria-hidden="true"
        />
        {/* photo placeholder */}
        <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] uppercase tracking-[0.3em] text-silver/50">
          PHOTO
        </span>
      </div>

      {/* upright label */}
      <span
        className={`pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-max max-w-[42vw] -translate-x-1/2 text-center transition-opacity duration-150 ${
          revealed
            ? "opacity-100"
            : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"
        }`}
        style={{ transform: `rotate(${-product.homeRot}deg)` }}
      >
        <span className="block font-blackletter text-base leading-tight text-bone">
          {product.name}
        </span>
        <span className="mt-0.5 block font-display text-sm text-crimson-bright">
          PKR {product.price}
        </span>
      </span>
    </motion.a>
  );
}

export default function ScatterField({ products }: Props) {
  const reduced = useReducedMotion();
  const [triggered, setTriggered] = useState(false);
  const triggeredRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const trigger = () => {
    if (triggeredRef.current) return;
    triggeredRef.current = true;
    setTriggered(true);
  };

  useEffect(() => {
    if (reduced) {
      trigger();
      return;
    }
    const el = containerRef.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.intersectionRatio >= 0.4) {
            trigger();
            io.disconnect();
          }
        }
      },
      { threshold: [0, 0.4] },
    );
    io.observe(el);

    const onTouch = () => trigger();
    el.addEventListener("touchstart", onTouch, { passive: true });

    return () => {
      io.disconnect();
      el.removeEventListener("touchstart", onTouch);
    };
  }, [reduced]);

  return (
    <section
      ref={containerRef}
      className="relative mx-auto w-full max-w-[1000px] overflow-hidden"
      style={{ aspectRatio: String(FIELD_ASPECT) }}
      aria-label="Veigin homepage products"
    >
      {/* Central 40% trigger zone (desktop pointer). */}
      <div
        className="absolute left-[30%] top-[30%] z-10 h-[40%] w-[40%]"
        onMouseEnter={trigger}
        aria-hidden="true"
      />

      {products.map((p, i) => (
        <ScatterCard
          key={p.id}
          product={p}
          index={i}
          triggered={triggered}
          reduced={!!reduced}
        />
      ))}
    </section>
  );
}