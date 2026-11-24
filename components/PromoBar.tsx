import { DEFAULT_SETTINGS, getSettings } from "@/lib/settings";

function PromoContent({ percent, threshold }: { percent: number; threshold: number }) {
  return (
    <div className="bg-crimson">
      <p className="mx-auto max-w-[1400px] px-4 py-2 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-bone">
        {percent}% off on orders over PKR {threshold.toLocaleString("en-PK")}
      </p>
    </div>
  );
}

export function PromoBarFallback() {
  return (
    <PromoContent
      percent={DEFAULT_SETTINGS.discountPercent}
      threshold={DEFAULT_SETTINGS.discountThreshold}
    />
  );
}

export default async function PromoBar() {
  const { discountPercent, discountThreshold } = await getSettings();
  return (
    <PromoContent percent={discountPercent} threshold={discountThreshold} />
  );
}