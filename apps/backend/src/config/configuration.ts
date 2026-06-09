import { registerAs } from '@nestjs/config';

/** Typed config namespaces, loaded once and injected via ConfigService. */

export const appConfig = registerAs('app', () => ({
  port: parseInt(process.env.PORT ?? '4000', 10),
  env: process.env.NODE_ENV ?? 'development',
  storeName: process.env.STORE_NAME ?? 'Budget Tees',
  defaultCurrency: process.env.DEFAULT_CURRENCY ?? 'NPR',
}));

export const databaseConfig = registerAs('database', () => ({
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'budget_tees',
}));

export const redisConfig = registerAs('redis', () => ({
  host: process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
}));

export const jwtConfig = registerAs('jwt', () => ({
  accessSecret: process.env.JWT_ACCESS_SECRET ?? 'dev-access-secret-change-me',
  accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
  refreshTtlDays: parseInt(process.env.JWT_REFRESH_TTL_DAYS ?? '30', 10),
}));

export const smtpConfig = registerAs('smtp', () => ({
  host: process.env.SMTP_HOST ?? 'localhost',
  port: parseInt(process.env.SMTP_PORT ?? '1025', 10),
  user: process.env.SMTP_USER ?? '',
  password: process.env.SMTP_PASSWORD ?? '',
  fromName: process.env.SMTP_FROM_NAME ?? 'Budget Tees',
  fromAddress: process.env.SMTP_FROM_ADDRESS ?? 'no-reply@budgettees.local',
}));

export const storageConfig = registerAs('storage', () => ({
  driver: process.env.STORAGE_DRIVER ?? 'local',
  s3Bucket: process.env.S3_BUCKET ?? '',
  s3Region: process.env.S3_REGION ?? '',
  s3Endpoint: process.env.S3_ENDPOINT ?? '',
  s3AccessKey: process.env.S3_ACCESS_KEY ?? '',
  s3SecretKey: process.env.S3_SECRET_KEY ?? '',
  cdnBaseUrl: process.env.CDN_BASE_URL ?? '',
  localDir: process.env.LOCAL_UPLOAD_DIR ?? 'uploads',
  publicBaseUrl: process.env.PUBLIC_BASE_URL ?? 'http://localhost:4000',
}));

export const paymentConfig = registerAs('payment', () => ({
  baseReturnUrl: process.env.PAYMENT_RETURN_URL ?? 'http://localhost:4000/api/payments',
  websiteUrl: process.env.PAYMENT_WEBSITE_URL ?? 'http://localhost:3000',
  esewa: {
    productCode: process.env.ESEWA_PRODUCT_CODE ?? 'EPAYTEST',
    secret: process.env.ESEWA_SECRET ?? '8gBm/:&EnhH.1/q',
    formUrl: process.env.ESEWA_FORM_URL ?? 'https://rc-epay.esewa.com.np/api/epay/main/v2/form',
  },
  khalti: {
    secret: process.env.KHALTI_SECRET ?? '',
    baseUrl: process.env.KHALTI_BASE_URL ?? 'https://dev.khalti.com/api/v2',
  },
}));

export const configLoaders = [
  paymentConfig,
  appConfig,
  databaseConfig,
  redisConfig,
  jwtConfig,
  smtpConfig,
  storageConfig,
];
