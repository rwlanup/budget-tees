/** Mirrors backend Category entity. `children` present in the tree response. */
export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  imageMediaId: string | null;
  sortOrder: number;
  isActive: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  children?: Category[];
  createdAt: string;
  updatedAt: string;
}

/** A category flattened with its depth (for indented parent selects). */
export interface FlatCategory {
  category: Category;
  depth: number;
}

/** Depth-first flatten of a category tree, carrying depth for indentation. */
export function flattenTree(
  nodes: Category[],
  depth = 0,
  acc: FlatCategory[] = [],
): FlatCategory[] {
  for (const node of nodes) {
    acc.push({ category: node, depth });
    if (node.children?.length) flattenTree(node.children, depth + 1, acc);
  }
  return acc;
}

/** Ids of a node and all its descendants (to exclude as move targets). */
export function subtreeIds(node: Category, acc: string[] = []): string[] {
  acc.push(node.id);
  for (const c of node.children ?? []) subtreeIds(c, acc);
  return acc;
}
