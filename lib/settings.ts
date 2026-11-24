import { connection } from "next/server";
import { query } from "@/lib/db";

export type StoreSettings = {
  deliveryFee: number;
  discountThreshold: number;
  discountPercent: number;
  paymentHoldHours: number;
};

export const DEFAULT_SETTINGS: StoreSettings = {
  deliveryFee: 200,
  discountThreshold: 5000,
  discountPercent: 10,
  paymentHoldHours: 24,
};

export async function getSettings(): Promise<StoreSettings> {
  // Settings are read per request, so the promo bar renders at request time
  // and the prerendered shell shows the fallback in the meantime.
  await connection();

  try {
    const rows = await query<{ setting_key: string; setting_value: string }>(
      "SELECT setting_key, setting_value FROM settings",
    );
    const map = new Map(rows.map((r) => [r.setting_key, r.setting_value]));

    const num = (key: string, fallback: number): number => {
      const raw = map.get(key);
      if (raw === undefined) return fallback;
      const value = Number(raw);
      return Number.isFinite(value) ? value : fallback;
    };

    return {
      deliveryFee: num("delivery_fee", DEFAULT_SETTINGS.deliveryFee),
      discountThreshold: num(
        "discount_threshold",
        DEFAULT_SETTINGS.discountThreshold,
      ),
      discountPercent: num("discount_percent", DEFAULT_SETTINGS.discountPercent),
      paymentHoldHours: num(
        "payment_hold_hours",
        DEFAULT_SETTINGS.paymentHoldHours,
      ),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}