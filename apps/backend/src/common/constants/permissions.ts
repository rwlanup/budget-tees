/**
 * Single source of truth for all permission keys.
 * - `@Permissions(PERMISSIONS.PRODUCT_MANAGE)` on routes
 * - seeded into the `permissions` table (Role module)
 * Convention: `resource.action[.scope]`. `.own` = acts on caller-owned records.
 */
export const PERMISSIONS = {
  // RBAC
  ROLE_MANAGE: 'role.manage',
  // Users
  USER_MANAGE: 'user.manage',
  PROFILE_MANAGE_OWN: 'profile.manage.own',
  // Catalog
  CATEGORY_MANAGE: 'category.manage',
  TAG_MANAGE: 'tag.manage',
  BRAND_MANAGE: 'brand.manage',
  PRODUCT_MANAGE: 'product.manage',
  ATTRIBUTE_MANAGE: 'attribute.manage',
  SKU_MANAGE: 'sku.manage',
  SALE_MANAGE: 'sale.manage',
  FEATURED_MANAGE: 'featured.manage',
  MEDIA_MANAGE: 'media.manage',
  // Commerce
  COUPON_MANAGE: 'coupon.manage',
  TAX_MANAGE: 'tax.manage',
  ORDER_MANAGE: 'order.manage',
  ORDER_CREATE_OWN: 'order.create.own',
  ORDER_READ_OWN: 'order.read.own',
  PAYMENT_MANAGE: 'payment.manage',
  RETURN_MANAGE: 'return.manage',
  RETURN_CREATE_OWN: 'return.create.own',
  CART_MANAGE_OWN: 'cart.manage.own',
  WISHLIST_MANAGE_OWN: 'wishlist.manage.own',
  REVIEW_CREATE_OWN: 'review.create.own',
  REVIEW_MANAGE: 'review.manage',
  CONTACT_MANAGE: 'contact.manage',
  // Config / infra
  SETTINGS_MANAGE: 'settings.manage',
  LOCATION_MANAGE: 'location.manage',
  EMAIL_MANAGE: 'email.manage',
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

/** Permission catalog with grouping (for admin UI + seeding). */
export const PERMISSION_CATALOG: { key: PermissionKey; group: string; description: string }[] = [
  { key: PERMISSIONS.ROLE_MANAGE, group: 'rbac', description: 'Manage roles and permissions' },
  { key: PERMISSIONS.USER_MANAGE, group: 'user', description: 'Manage all users' },
  { key: PERMISSIONS.PROFILE_MANAGE_OWN, group: 'user', description: 'Manage own profile' },
  { key: PERMISSIONS.CATEGORY_MANAGE, group: 'catalog', description: 'Manage categories' },
  { key: PERMISSIONS.TAG_MANAGE, group: 'catalog', description: 'Manage tags' },
  { key: PERMISSIONS.BRAND_MANAGE, group: 'catalog', description: 'Manage brands' },
  { key: PERMISSIONS.PRODUCT_MANAGE, group: 'catalog', description: 'Manage products' },
  { key: PERMISSIONS.ATTRIBUTE_MANAGE, group: 'catalog', description: 'Manage attributes' },
  { key: PERMISSIONS.SKU_MANAGE, group: 'catalog', description: 'Manage SKUs and inventory' },
  { key: PERMISSIONS.SALE_MANAGE, group: 'catalog', description: 'Manage product sales' },
  { key: PERMISSIONS.FEATURED_MANAGE, group: 'catalog', description: 'Manage featured products' },
  { key: PERMISSIONS.MEDIA_MANAGE, group: 'catalog', description: 'Manage media assets' },
  { key: PERMISSIONS.COUPON_MANAGE, group: 'commerce', description: 'Manage coupons' },
  { key: PERMISSIONS.TAX_MANAGE, group: 'commerce', description: 'Manage tax classes and rates' },
  { key: PERMISSIONS.ORDER_MANAGE, group: 'commerce', description: 'Manage all orders' },
  { key: PERMISSIONS.ORDER_CREATE_OWN, group: 'commerce', description: 'Place own orders' },
  { key: PERMISSIONS.ORDER_READ_OWN, group: 'commerce', description: 'View own orders' },
  {
    key: PERMISSIONS.PAYMENT_MANAGE,
    group: 'commerce',
    description: 'Manage payments and refunds',
  },
  { key: PERMISSIONS.RETURN_MANAGE, group: 'commerce', description: 'Manage all returns' },
  { key: PERMISSIONS.RETURN_CREATE_OWN, group: 'commerce', description: 'Request own returns' },
  { key: PERMISSIONS.CART_MANAGE_OWN, group: 'commerce', description: 'Manage own cart' },
  { key: PERMISSIONS.WISHLIST_MANAGE_OWN, group: 'commerce', description: 'Manage own wishlist' },
  {
    key: PERMISSIONS.REVIEW_CREATE_OWN,
    group: 'commerce',
    description: 'Write own product reviews',
  },
  {
    key: PERMISSIONS.REVIEW_MANAGE,
    group: 'commerce',
    description: 'Moderate all product reviews',
  },
  {
    key: PERMISSIONS.CONTACT_MANAGE,
    group: 'commerce',
    description: 'View and manage contact messages',
  },
  { key: PERMISSIONS.SETTINGS_MANAGE, group: 'config', description: 'Manage store settings' },
  {
    key: PERMISSIONS.LOCATION_MANAGE,
    group: 'config',
    description: 'Manage shipping zones and locations',
  },
  {
    key: PERMISSIONS.EMAIL_MANAGE,
    group: 'config',
    description: 'Manage email logs and templates',
  },
];

/** Customer role default permissions (own-scoped). Admin gets everything. */
export const CUSTOMER_PERMISSIONS: PermissionKey[] = [
  PERMISSIONS.PROFILE_MANAGE_OWN,
  PERMISSIONS.ORDER_CREATE_OWN,
  PERMISSIONS.ORDER_READ_OWN,
  PERMISSIONS.RETURN_CREATE_OWN,
  PERMISSIONS.CART_MANAGE_OWN,
  PERMISSIONS.WISHLIST_MANAGE_OWN,
  PERMISSIONS.REVIEW_CREATE_OWN,
];

export const SYSTEM_ROLES = {
  ADMIN: 'admin',
  CUSTOMER: 'customer',
} as const;
