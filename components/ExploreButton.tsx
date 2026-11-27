"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ExploreButton() {
  const router = useRouter();
  const prefersReducedMotion = useReducedMotion();
  const [mountKey, setMountKey] = useState(0);

  // Next.js App Router (next/navigation) does not have router.asPath.
  // Instead, reset an1 For the love of all things dark
2 Dark by design.
3 Chains for the beautifully cursed.imation state on component mount / display by cancelling active Web Animations API animations.
  useEffect(() => {
    const arrow = document.querySelector(".explore-arrow") as HTMLElement | null;
    if (arrow) {
      // Cancel any running Web Animations API animation and clear fill: "forwards" inline styles
      const animations = arrow.getAnimations();
      animations.forEach((anim) => anim.cancel());
      arrow.style.transform = "";
    }
    // Schedule mountKey update in a microtask to avoid cascading renders
    Promise.resolve().then(() => setMountKey((prev) => prev + 1));
  }, []);


  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (prefersReducedMotion) {
      return; // let Link handle navigation normally
    }

    e.preventDefault();
    const link = e.currentTarget;
    const href = link.getAttribute("href") || "/products";

    // Find the arrow element
    const arrow = link.querySelector(".explore-arrow") as HTMLElement | null;
    if (!arrow) {
      router.push(href);
      return;
    }

    // Get button position and arrow position
    const btnRect = link.getBoundingClientRect();
    const arrowRect = arrow.getBoundingClientRect();
    const viewportWidth = window.innerWidth;

    // Distance from arrow center to right edge of viewport
    const distanceToEdge = viewportWidth - arrowRect.left - arrowRect.width / 2;

    // Animate arrow out to right edge
    const animation = arrow.animate(
      [
        { transform: "translateX(0)" },
        { transform: `translateX(${distanceToEdge}px)` },
      ],
      {
        duration: 500,
        easing: "ease-in-out",
        fill: "forwards",
      }
    );

    animation.onfinish = () => {
      router.push(href);
    };

    animation.oncancel = () => {
      router.push(href);
    };
  };

  return (
    <Link
      href="/products"
      onClick={handleClick}
      className="mt-8 inline-flex items-center rounded-2xl transition-transform duration-300 ease-in-out hover:scale-112 gap-3 border border-foreground px-6 py-3 font-price text-sm uppercase tracking-[0.14em] text-foreground transition-colors hover:bg-foreground hover:text-background focus-visible:bg-foreground focus-visible:text-background"
    >
      Explore the collection
      <motion.svg
        key={mountKey}
        className="explore-arrow size-4 shrink-0 transition-transform duration-300 ease-out group-hover:translate-x-1 group-focus-visible:translate-x-1"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="square"
        aria-hidden="true"
      >
        <path d="M5 12h14M13 6l6 6-6 6" />
      </motion.svg>
    </Link>
  );
}