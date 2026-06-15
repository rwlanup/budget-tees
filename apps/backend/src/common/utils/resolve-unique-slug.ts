import { FindOptionsWhere, ObjectLiteral, Repository } from 'typeorm';
import { slugify, uniqueSlug } from './slugify';

/**
 * Slugify `base` and ensure uniqueness against `repo`'s `slug` column,
 * appending -2, -3, … on clashes. `excludeId` skips the row being updated;
 * `withDeleted` includes soft-deleted rows in the uniqueness check.
 *
 * Shared by every sluggable entity service (Product, Category, Brand, Tag).
 */
export async function resolveUniqueSlug<T extends ObjectLiteral & { id: string; slug: string }>(
  repo: Repository<T>,
  base: string,
  opts: { excludeId?: string; withDeleted?: boolean } = {},
): Promise<string> {
  return uniqueSlug(slugify(base), async (candidate) => {
    const existing = await repo.findOne({
      where: { slug: candidate } as FindOptionsWhere<T>,
      withDeleted: opts.withDeleted,
    });
    return !!existing && existing.id !== opts.excludeId;
  });
}
