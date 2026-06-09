import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Setting } from './entities/setting.entity';
import { ShippingCountry } from './entities/shipping-country.entity';
import { SettingsService } from './services/settings.service';
import { ShippingCountryService } from './services/shipping-country.service';
import {
  AdminSettingsController,
  PublicSettingsController,
} from './controllers/settings.controller';
import {
  AdminShippingCountryController,
  ShippingCountryController,
} from './controllers/shipping-country.controller';

/** @Global so SettingsService/ShippingCountryService inject anywhere without re-import. */
@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Setting, ShippingCountry])],
  controllers: [
    AdminSettingsController,
    PublicSettingsController,
    ShippingCountryController,
    AdminShippingCountryController,
  ],
  providers: [SettingsService, ShippingCountryService],
  exports: [SettingsService, ShippingCountryService],
})
export class SettingsModule {}
