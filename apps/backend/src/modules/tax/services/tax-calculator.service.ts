import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TaxClass } from '../entities/tax-class.entity';
import { TaxRate } from '../entities/tax-rate.entity';
import { extractInclusiveTax } from '../../../common/utils/money';

export interface LineTax {
  net: number;
  tax: number;
  rate: number;
  label: string | null;
}

/** Resolves rates and extracts embedded tax from tax-inclusive amounts. */
@Injectable()
export class TaxCalculatorService {
  private readonly logger = new Logger(TaxCalculatorService.name);

  constructor(
    @InjectRepository(TaxClass) private readonly classRepo: Repository<TaxClass>,
    @InjectRepository(TaxRate) private readonly rateRepo: Repository<TaxRate>,
  ) {}

  async resolveRate(
    taxClassId: string | null,
    countryCode: string,
  ): Promise<{ rate: number; label: string | null }> {
    let classId = taxClassId;
    if (!classId) {
      const def = await this.classRepo.findOne({ where: { isDefault: true, isActive: true } });
      classId = def?.id ?? null;
    }
    if (!classId) return { rate: 0, label: null };
    const rate = await this.rateRepo.findOne({
      where: { taxClassId: classId, countryCode: countryCode.toUpperCase(), isActive: true },
    });
    if (!rate) {
      this.logger.warn(`No tax rate for class ${classId} country ${countryCode} — taxing at 0`);
      return { rate: 0, label: null };
    }
    return { rate: rate.rate, label: rate.name };
  }

  /** Extract embedded tax from a tax-inclusive line amount (post-discount). */
  async extractLineTax(
    inclusiveAmount: number,
    taxClassId: string | null,
    countryCode: string,
  ): Promise<LineTax> {
    const { rate, label } = await this.resolveRate(taxClassId, countryCode);
    const { net, tax } = extractInclusiveTax(inclusiveAmount, rate);
    return { net, tax, rate, label };
  }
}
