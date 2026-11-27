
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  motion,
  useReducedMotion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import {
  CARD_ASPECT,
  CARD_WIDTH_PCT,
  FIELD_ASPECT,
  FIELD_WIDTH,
  FIELD_HEIGHT,
  displacedFor,
  type HomeProduct,
} from "@/lib/scatter";

type Props = {
  products: HomeProduct[];
};

interface CardPositions {
  homeX: number;
  homeY: number;
  homeRot: number;
  scatteredX: number; // entrance offset only
  scatteredY: number; // entrance offset only
  scatteredRot: number; // entrance rotation only
  organizedX: number; // px offset from home to grid slot
  organizedY: number;
  organizedScale: number;
}

const SPRING = { stiffness: 180, damping: 22, mass: 0.9 };

function ScatterCard({
  product,
  index,
  isOrganized,
  entered,
  reduced,
  positions: p,
}: {
  product: HomeProduct;
  index: number;
  isOrganized: boolean;
  entered: boolean;
  reduced: boolean;
  positions: CardPositions;
}) {
  const [active, setActive] = useState(false);
  const hasEnteredRef = useRef(false);

  // Targets start at the entrance (displaced) state.
  const targetX = useMotionValue(p.scatteredX);
  const targetY = useMotionValue(p.scatteredY);
  const targetRot = useMotionValue(p.homeRot + p.scatteredRot);
  const targetScale = useMotionValue(1);

  const x = useSpring(targetX, SPRING);
  const y = useSpring(targetY, SPRING);
  const rotate = useSpring(targetRot, SPRING);
  const scale = useSpring(targetScale, SPRING);

  // Keeps the label upright whatever the card's rotation is.
  const counterRotate = useTransform(rotate, (r) => -r);

  useEffect(() => {
    if (!entered) return;

    const apply = () => {
      const tx = isOrganized ? p.organizedX : 0;
      const ty = isOrganized ? p.organizedY : 0;
      const tr = isOrganized ? 0 : p.homeRot;
      const ts = isOrganized ? p.organizedScale : 1;

      targetX.set(tx);
      targetY.set(ty);
      targetRot.set(tr);
      targetScale.set(ts);

      if (reduced) {
        x.jump(tx);
        y.jump(ty);
        rotate.jump(tr);
        scale.jump(ts);
      }
      hasEnteredRef.current = true;
    };

    // Stagger only the first (entrance) movement.
    const delay = reduced || hasEnteredRef.current ? 0 : index * 60;
    if (delay === 0) {
      apply();
      return;
    }
    const id = window.setTimeout(apply, delay);
    return () => window.clearTimeout(id);
  }, [
    entered,
    isOrganized,
    reduced,
    index,
    p.organizedX,
    p.organizedY,
    p.organizedScale,
    p.homeRot,
    targetX,
    targetY,
    targetRot,
    targetScale,
    x,
    y,
    rotate,
    scale,
  ]);

  return (
    <motion.a
      href={`/products/${product.slug}`}
      suppressHydrationWarning
      className="group absolute block focus:outline-none"
      style={{
        left: `${product.homeX}%`,
        top: `${product.homeY}%`,
        width: `${CARD_WIDTH_PCT}%`,
        // Centers the card on its home anchor (lib/scatter.ts uses centers).
        translate: "-50% -50%",
        transformOrigin: "center center",
        zIndex: active ? 50 : index + 1,
        x,
        y,
        rotate,
        scale,
      }}
      onPointerEnter={() => setActive(true)}
      onPointerLeave={() => setActive(false)}
      onFocus={() => setActive(true)}
      onBlur={() => setActive(false)}
    >
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="relative rounded-none border border-silver/30 bg-panel"
        style={{ aspectRatio: "3 / 4" }}
      >
        <span
          className="absolute right-0 top-0 z-10 block h-3 w-3 bg-accent"
          aria-hidden="true"
        />
        <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] uppercase tracking-[0.3em] text-silver/50">
          PHOTO
        </span>
      </motion.div>

      <motion.span
        className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 w-max max-w-[42vw] -translate-x-1/2 text-center opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
        style={{ rotate: counterRotate }}
      >
        <span className="block font-name-face text-base leading-tight text-bone">
          {product.name}
        </span>
        <span className="mt-0.5 block font-price text-sm text-accent">
          PKR {product.price}
        </span>
      </motion.span>
    </motion.a>
  );
}

export default function ScatterField({ products }: Props) {
  const reduced = !!useReducedMotion();
  const [isOrganized, setIsOrganized] = useState(false);
  const [entered, setEntered] = useState(false);
  const isTouch = typeof window !== "undefined" && window.matchMedia("(hover: none)").matches;
  const defaultWidth = 770;
  const [containerSize, setContainerSize] = useState({
    width: defaultWidth,
    height: defaultWidth / FIELD_ASPECT,
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const entranceTriggeredRef = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    };
    updateSize();
    const ro = new ResizeObserver(updateSize);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (reduced) {
      queueMicrotask(() => setEntered(true));
      return;
    }
    const el = containerRef.current;
    if (!el) return;

    const trigger = () => {
      if (entranceTriggeredRef.current) return;
      entranceTriggeredRef.current = true;
      setEntered(true);
    };

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.intersectionRatio >= 0.4) {
            trigger();
            io.disconnect();
          }
        }
      },
      { threshold: [0, 0.4] },
    );
    io.observe(el);
    el.addEventListener("touchstart", trigger, { passive: true });

    return () => {
      io.disconnect();
      el.removeEventListener("touchstart", trigger);
    };
  }, [reduced]);

  const positions = useMemo<CardPositions[]>(() => {
    const n = products.length;
    if (n === 0) return [];

    const scale = containerSize.width / FIELD_WIDTH;

    // Card height as a percent of FIELD HEIGHT (width is a percent of field width).
    const cardHPct = (CARD_WIDTH_PCT / CARD_ASPECT) * (FIELD_WIDTH / FIELD_HEIGHT);

    const cols = n <= 4 ? 2 : 3;
    const rows = Math.ceil(n / cols);
    const gap = 3;
    const needW = cols * CARD_WIDTH_PCT + (cols - 1) * gap;
    const needH = rows * cardHPct + (rows - 1) * gap;
    // Shrink the grid if it would not fit inside the field.
    const s = Math.min(1, 94 / needW, 90 / needH);

    const w = CARD_WIDTH_PCT * s;
    const h = cardHPct * s;
    const gridW = cols * w + (cols - 1) * gap;
    const gridH = rows * h + (rows - 1) * gap;
    const startX = (100 - gridW) / 2;
    const startY = (100 - gridH) / 2;

    return products.map((p, i) => {
      const displaced = displacedFor(p.id, p.homeX, p.homeY);
      const col = i % cols;
      const row = Math.floor(i / cols);

      // Slot centres, in percent of the field.
      const cx = startX + col * (w + gap) + w / 2;
      const cy = startY + row * (h + gap) + h / 2;

      return {
        homeX: p.homeX,
        homeY: p.homeY,
        homeRot: p.homeRot,
        scatteredX: displaced.x * scale,
        scatteredY: displaced.y * scale,
        scatteredRot: displaced.rot,
        organizedX: ((cx - p.homeX) * containerSize.width) / 100,
        organizedY: ((cy - p.homeY) * containerSize.height) / 100,
        organizedScale: s,
      };
    });
  }, [products, containerSize.width, containerSize.height]);

  const organize = () => {
    if (!reduced) setIsOrganized(true);
  };
  const scatter = () => {
    if (!reduced) setIsOrganized(false);
  };
  const toggle = () => setIsOrganized((prev) => !prev);

  return (
    <section
      ref={containerRef}
      className="relative mx-auto w-full max-w-[770px] overflow-hidden"
      style={{ aspectRatio: String(FIELD_ASPECT) }}
      aria-label="Veigin homepage products"
      onMouseEnter={organize}
      onMouseLeave={scatter}
      onFocus={organize}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) scatter();
      }}
      onKeyDown={(e) => {
        // Only toggle when the section itself is focused, so Enter on a
        // card link still navigates.
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
      }}
      tabIndex={0}
    >
      {isTouch && (
        <button
          type="button"
          onClick={toggle}
          className="absolute bottom-4 left-1/2 z-[60] -translate-x-1/2 rounded-none border border-silver/30 bg-panel px-4 py-2 font-display text-xs uppercase tracking-[0.14em] text-bone"
          aria-pressed={isOrganized}
          aria-label={isOrganized ? "View scattered" : "View aligned"}
        >
          {isOrganized ? "Scatter" : "Align"}
        </button>
      )}

      {products.map((p, i) => (
        <ScatterCard
          key={p.id}
          product={p}
          index={i}
          isOrganized={isOrganized}
          entered={entered}
          reduced={reduced}
          positions={positions[i]}
        />
      ))}
    </section>
  );
}