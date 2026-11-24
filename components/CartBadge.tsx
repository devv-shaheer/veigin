"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import { IconBag } from "@/components/icons";

export default function CartBadge() {
  const { count } = useCart();
  return (
    <Link
      href="/cart"
      aria-label="Cart"
      className="relative flex size-7 items-center justify-center text-bone xl:size-8"
    >
      <IconBag />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center bg-crimson px-1 font-mono text-[9px] text-bone">
          {count}
        </span>
      )}
    </Link>
  );
}