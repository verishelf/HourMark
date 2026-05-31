import Image from "next/image";

type Props = {
  size?: number;
  className?: string;
  priority?: boolean;
};

export function CrownlyLogo({ size = 48, className = "", priority = false }: Props) {
  return (
    <Image
      src="/crownly-logo.png"
      alt="Crownly"
      width={size}
      height={size}
      className={`object-contain ${className}`.trim()}
      priority={priority}
    />
  );
}
