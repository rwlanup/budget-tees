import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { configLoaders } from './config/configuration';
import { SettingsModule } from './modules/settings/settings.module';
import { RoleModule } from './modules/role/role.module';
import { MediaModule } from './modules/media/media.module';
import { SecurityModule } from './common/security/password.service';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoryModule } from './modules/category/category.module';
import { TagModule } from './modules/tag/tag.module';
import { BrandModule } from './modules/brand/brand.module';
import { ProductModule } from './modules/product/product.module';
import { AttributeModule } from './modules/attribute/attribute.module';
import { SkuModule } from './modules/sku/sku.module';
import { TaxModule } from './modules/tax/tax.module';
import { ProductSaleModule } from './modules/product-sale/product-sale.module';
import { LocationModule } from './modules/location/location.module';
import { CartModule } from './modules/cart/cart.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { CouponModule } from './modules/coupon/coupon.module';
import { OrderModule } from './modules/order/order.module';
import { PaymentModule } from './modules/payment/payment.module';
import { ReturnModule } from './modules/return/return.module';
import { EmailModule } from './modules/email/email.module';
import { FeaturedProductModule } from './modules/featured-product/featured-product.module';
import { StorefrontModule } from './modules/storefront/storefront.module';
import { ReviewModule } from './modules/review/review.module';
import { ContactModule } from './modules/contact/contact.module';
import { NotificationModule } from './modules/notification/notification.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: configLoaders }),
    EventEmitterModule.forRoot(),
    SecurityModule,
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 120 }]),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.username'),
        password: config.get<string>('database.password'),
        database: config.get<string>('database.database'),
        autoLoadEntities: true,
        synchronize: false,
        migrations: [__dirname + '/migrations/*.{ts,js}'],
        logging: config.get<string>('database.logging') === 'true',
        ssl: {
          rejectUnauthorized: false,
        }
      }),
    }),
    // Feature modules (migration order).
    SettingsModule,
    RoleModule,
    MediaModule,
    UserModule,
    AuthModule,
    CategoryModule,
    TagModule,
    BrandModule,
    ProductModule,
    AttributeModule,
    SkuModule,
    TaxModule,
    ProductSaleModule,
    LocationModule,
    CartModule,
    WishlistModule,
    CouponModule,
    OrderModule,
    PaymentModule,
    ReturnModule,
    EmailModule,
    FeaturedProductModule,
    StorefrontModule,
    ReviewModule,
    ContactModule,
    NotificationModule,
  ],
})
export class AppModule {}
