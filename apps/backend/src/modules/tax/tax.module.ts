import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaxClass } from './entities/tax-class.entity';
import { TaxRate } from './entities/tax-rate.entity';
import { TaxService } from './services/tax.service';
import { TaxCalculatorService } from './services/tax-calculator.service';
import { TaxClassController, TaxRateController } from './tax.controller';

@Module({
  imports: [TypeOrmModule.forFeature([TaxClass, TaxRate])],
  controllers: [TaxClassController, TaxRateController],
  providers: [TaxService, TaxCalculatorService],
  exports: [TaxService, TaxCalculatorService],
})
export class TaxModule {}
