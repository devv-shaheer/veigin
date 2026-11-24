"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { Product } from "@/lib/products";

export type CartItem = {
  productId: number;
  slug: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
};

type CartContextValue = {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: number) => void;
  updateQty: (productId: number, quantity: number) => void;
  clear: () => void;
  subtotal: number;
  count: number;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "veigin:cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore
    }
    queueMicrotask(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items, hydrated]);

  const addItem = useCallback((product: Product, quantity = 1) => {
    const safeStock = Number.isFinite(product.stock) && product.stock > 0 ? product.stock : 1;
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      const maxQty = Math.max(1, safeStock);
      const q = Math.max(1, Math.floor(quantity || 1));
      if (existing) {
        return prev.map((i) =>
          i.productId === product.id
            ? { ...i, quantity: Math.min(maxQty, i.quantity + q), stock: safeStock }
            : i,
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          quantity: Math.min(maxQty, q),
          stock: safeStock,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((productId: number) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const updateQty = useCallback((productId: number, quantity: number) => {
    setItems((prev) =>
      prev
        .map((i) => {
          if (i.productId !== productId) return i;
          const safeStock = Number.isFinite(i.stock) && i.stock > 0 ? i.stock : 1;
          const clamped = Math.max(1, Math.min(safeStock, Math.floor(quantity || 1)));
          return { ...i, quantity: clamped, stock: safeStock };
        })
        .filter((i) => i.quantity > 0),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQty, clear, subtotal, count }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}