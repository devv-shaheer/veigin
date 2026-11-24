type SkeletonProps = {
  className?: string;
};

export default function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={["animate-pulse bg-silver/15", className]
        .filter(Boolean)
        .join(" ")}
    />
  );
}