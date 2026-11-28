"use client";

import { useState, createContext, useContext, ReactNode } from "react";
import { adjustStockAction } from "@/app/(admin)/admin/inventory/actions";

interface InventoryRow {
  id: number;
  name: string;
  slug: string;
  stock: number;
  availability: string;
}

interface AdjustStockContextValue {
  openAdjustModal: (product: InventoryRow) => void;
}

const AdjustStockContext = createContext<AdjustStockContextValue | null>(null);

export function useAdjustStock() {
  const context = useContext(AdjustStockContext);
  if (!context) {
    throw new Error("useAdjustStock must be used within an AdjustStockProvider");
  }
  return context;
}

interface AdjustStockProviderProps {
  children: ReactNode;
  inventory: InventoryRow[];
}

export function AdjustStockProvider({ children, inventory }: AdjustStockProviderProps) {
  const [open, setOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<InventoryRow | null>(null);
  const [adjustment, setAdjustment] = useState("");
  const [reason, setReason] = useState("");

  const openAdjustModal = (product: InventoryRow) => {
    setSelectedProduct(product);
    setAdjustment("");
    setReason("");
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("id", String(selectedProduct?.id));
    formData.set("adjustment", adjustment);
    formData.set("reason", reason);
    await adjustStockAction(formData);
    setOpen(false);
  };

  return (
    <AdjustStockContext.Provider value={{ openAdjustModal }}>
      {children}
      {open && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="admin-shell__card admin-shell__login-card max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-[var(--admin-text)]">Adjust Stock</h2>
              <button
                onClick={() => setOpen(false)}
                className="text-[var(--admin-text-muted)] hover:text-[var(--admin-text)] text-xl font-medium"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="admin-shell__form-group">
                <label className="admin-shell__label">Product</label>
                <div className="admin-shell__input" style={{ backgroundColor: "var(--admin-bg)", cursor: "default" }}>
                  <div className="font-medium">{selectedProduct.name}</div>
                  <div className="text-xs font-mono" style={{ color: "var(--admin-text-muted)" }}>Current stock: {selectedProduct.stock}</div>
                </div>
              </div>

              <div className="admin-shell__form-group">
                <label className="admin-shell__label">Adjustment (use negative to reduce)</label>
                <input
                  type="number"
                  value={adjustment}
                  onChange={(e) => setAdjustment(e.target.value)}
                  required
                  className="admin-shell__input"
                  placeholder={selectedProduct.stock > 0 ? "-5 to reduce" : "5 to add"}
                  min={selectedProduct.stock > 0 ? -selectedProduct.stock : undefined}
                />
                <p className="text-xs mt-1" style={{ color: "var(--admin-text-muted)" }}>
                  {selectedProduct.stock > 0
                    ? `Current stock: ${selectedProduct.stock}. Enter negative value to reduce (min: -${selectedProduct.stock}).`
                    : `Current stock: 0. Enter positive value to add stock.`}
                </p>
              </div>

              <div className="admin-shell__form-group">
                <label className="admin-shell__label">Reason</label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="admin-shell__input"
                  placeholder="e.g. Received shipment, Damaged items, Manual count"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t" style={{ borderColor: "var(--admin-border)" }}>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="admin-shell__btn admin-shell__btn--secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-shell__btn admin-shell__btn--primary"
                >
                  Apply Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdjustStockContext.Provider>
  );
}