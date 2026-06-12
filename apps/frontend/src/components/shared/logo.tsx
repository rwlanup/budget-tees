import Image from 'next/image';
import { siteConfig } from '@/config/site';

/** Intrinsic ratio of /public/logo.png (551×511). */
const RATIO = 551 / 511;

/** Brand logo image. Height-driven; width derived from the source aspect ratio. */
export function Logo({
  height = 36,
  className,
  priority = false,
}: {
  height?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/logo.png"
      alt={siteConfig.name}
      width={Math.round(height * RATIO)}
      height={height}
      priority={priority}
      className={className}
    />
  );
}
