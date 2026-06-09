import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAddress } from './entities/user-address.entity';
import { ShippingZone, ShippingZoneRegion } from './entities/shipping-zone.entity';
import { PickupLocation } from './entities/pickup-location.entity';
import { AddressService } from './services/address.service';
import { ShippingZoneService } from './services/shipping-zone.service';
import { PickupService } from './services/pickup.service';
import { ShippingCalculatorService } from './services/shipping-calculator.service';
import { MeAddressController } from './controllers/address.controller';
import { AdminPickupController, PickupController } from './controllers/pickup.controller';
import {
  AdminShippingZoneController,
  ShippingQuoteController,
} from './controllers/shipping.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserAddress, ShippingZone, ShippingZoneRegion, PickupLocation]),
  ],
  controllers: [
    MeAddressController,
    PickupController,
    AdminPickupController,
    ShippingQuoteController,
    AdminShippingZoneController,
  ],
  providers: [AddressService, ShippingZoneService, PickupService, ShippingCalculatorService],
  exports: [AddressService, PickupService, ShippingCalculatorService],
})
export class LocationModule {}
