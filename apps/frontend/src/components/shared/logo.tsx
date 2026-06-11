import Image from 'next/image';
import { siteConfig } from '@/config/site';

/** Intrinsic ratio of /public/logo.jpeg (551×511). */
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
      src="/logo.jpeg"
      alt={siteConfig.name}
      width={Math.round(height * RATIO)}
      height={height}
      priority={priority}
      className={className}
    />
  );
}
