export default function Logo({ className, priority }: { className?: string; priority?: boolean }) {
  return (
    <img
      src="/brand/veiginlogo.png"
      alt="VEIGIN"
      className={`object-contain brightness-0 invert ${className}`}
      draggable={false}
      {...(priority ? { fetchPriority: "high" } : {})}
    />
  );
}