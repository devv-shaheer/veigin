import Skeleton from "@/components/Skeleton";

export default function Page() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-[1400px] flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-silver">
        Stage 02
      </p>
      <p className="max-w-md font-mono text-sm text-silver">
        Layout shell: promo bar, header, footer and mobile menu. Homepage
        content arrives in a later stage.
      </p>
      <div className="mt-2 w-full max-w-sm space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </main>
  );
}