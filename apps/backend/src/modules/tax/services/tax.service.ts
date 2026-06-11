import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { TaxClass } from '../entities/tax-class.entity';
import { TaxRate } from '../entities/tax-rate.entity';
import { slugify, uniqueSlug } from '../../../common/utils/slugify';
import {
  CreateTaxClassDto,
  CreateTaxRateDto,
  UpdateTaxClassDto,
  UpdateTaxRateDto,
} from '../dto/tax.dto';

@Injectable()
export class TaxService {
  constructor(
    @InjectRepository(TaxClass) private readonly classRepo: Repository<TaxClass>,
    @InjectRepository(TaxRate) private readonly rateRepo: Repository<TaxRate>,
  ) {}

  listClasses(): Promise<TaxClass[]> {
    return this.classRepo.find({ order: { name: 'ASC' } });
  }

  async createClass(dto: CreateTaxClassDto): Promise<TaxClass> {
    if (await this.classRepo.findOne({ where: { name: dto.name } })) {
      throw new ConflictException('Tax class name already exists');
    }
    const slug = await uniqueSlug(slugify(dto.slug ?? dto.name), async (c) => {
      return !!(await this.classRepo.findOne({ where: { slug: c } }));
    });
    if (dto.isDefault) await this.classRepo.update({ isDefault: true }, { isDefault: false });
    return this.classRepo.save(
      this.classRepo.create({
        name: dto.name,
        slug,
        isDefault: dto.isDefault ?? false,
        isActive: dto.isActive ?? true,
      }),
    );
  }

  async updateClass(id: string, dto: UpdateTaxClassDto): Promise<TaxClass> {
    const cls = await this.classRepo.findOne({ where: { id } });
    if (!cls) throw new NotFoundException('Tax class not found');
    if (dto.isDefault === true) {
      await this.classRepo.update({ isDefault: true, id: Not(id) }, { isDefault: false });
      cls.isDefault = true;
    } else if (dto.isDefault === false) {
      cls.isDefault = false;
    }
    if (dto.name) cls.name = dto.name;
    if (dto.isActive !== undefined) cls.isActive = dto.isActive;
    return this.classRepo.save(cls);
  }

  async removeClass(id: string): Promise<void> {
    const res = await this.classRepo.delete({ id });
    if (!res.affected) throw new NotFoundException('Tax class not found');
  }

  listRates(countryCode?: string, taxClassId?: string): Promise<TaxRate[]> {
    return this.rateRepo.find({
      where: {
        ...(countryCode ? { countryCode: countryCode.toUpperCase() } : {}),
        ...(taxClassId ? { taxClassId } : {}),
      },
      order: { countryCode: 'ASC' },
    });
  }

  async createRate(dto: CreateTaxRateDto): Promise<TaxRate> {
    if (!(await this.classRepo.findOne({ where: { id: dto.taxClassId } }))) {
      throw new NotFoundException('Tax class not found');
    }
    const country = dto.countryCode.toUpperCase();
    if (
      await this.rateRepo.findOne({ where: { taxClassId: dto.taxClassId, countryCode: country } })
    ) {
      throw new ConflictException('Rate already exists for this class and country');
    }
    return this.rateRepo.save(
      this.rateRepo.create({
        taxClassId: dto.taxClassId,
        name: dto.name,
        countryCode: country,
        rate: dto.rate,
        isActive: dto.isActive ?? true,
      }),
    );
  }

  async updateRate(id: string, dto: UpdateTaxRateDto): Promise<TaxRate> {
    const rate = await this.rateRepo.findOne({ where: { id } });
    if (!rate) throw new NotFoundException('Tax rate not found');
    Object.assign(rate, {
      name: dto.name ?? rate.name,
      rate: dto.rate ?? rate.rate,
      isActive: dto.isActive ?? rate.isActive,
    });
    return this.rateRepo.save(rate);
  }

  async removeRate(id: string): Promise<void> {
    const res = await this.rateRepo.delete({ id });
    if (!res.affected) throw new NotFoundException('Tax rate not found');
  }
}
