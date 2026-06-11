import type { LucideIcon } from 'lucide-react';
import { StorefrontContainer } from './storefront-container';
import { EmptyState } from '@/components/shared/empty-state';

/** Placeholder for storefront routes built in later phases. */
export function ComingSoon({
  icon,
  title,
  description,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <StorefrontContainer className="py-16">
      <EmptyState icon={icon} title={title} description={description} />
    </StorefrontContainer>
  );
}
