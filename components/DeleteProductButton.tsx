"use client";

import { useState } from "react";

interface DeleteProductButtonProps {
  productId: number;
  productName: string;
  formAction: string;
}

export default function DeleteProductButton({
  productId,
  productName,
  formAction,
}: DeleteProductButtonProps) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium" style={{ color: "var(--admin-crimson)" }}>
          Delete "{productName}"?
        </span>
        <button
          type="button"
          onClick={() => {
            // Submit the hidden form
            const form = document.querySelector(`form[data-product-id="${productId}"]`);
            if (form) {
              form.requestSubmit();
            }
            setConfirming(false);
          }}
          className="text-xs font-medium hover:underline" style={{ color: "var(--admin-crimson)" }}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-xs font-medium hover:underline" style={{ color: "var(--admin-text-muted)" }}
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
      className="text-sm font-medium hover:underline" style={{ color: "var(--admin-crimson)" }}
    >
      Delete
    </button>
  );
}
