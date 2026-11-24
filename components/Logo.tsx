import Image from "next/image";

type LogoProps = {
  className?: string;
  priority?: boolean;
};

// The Veigin wordmark is rendered only here, from the real asset, at its
// intrinsic aspect ratio (818 x 174). Never recreated with a font.
export default function Logo({ className, priority = false }: LogoProps) {
  return (
    <Image
      src="/brand/logo-bone.png"
      alt="Veigin"
      width={818}
      height={174}
      priority={priority}
      className={className}
    />
  );
}