import { BadRequestException, Injectable, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Setting } from '../entities/setting.entity';
import { SettingType } from '../enums/setting-type.enum';
import { SETTINGS_SCHEMA, SettingDefinition } from '../constants/settings-schema';

/**
 * Typed key-value settings registry with an in-process cache.
 * Unknown keys (not in SETTINGS_SCHEMA) are rejected. Values fall back to schema defaults.
 */
@Injectable()
export class SettingsService {
  private cache = new Map<string, unknown>();
  private loaded = false;

  constructor(
    @InjectRepository(Setting)
    private readonly repo: Repository<Setting>,
  ) {}

  private async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    const rows = await this.repo.find();
    for (const row of rows) this.cache.set(row.key, row.value);
    this.loaded = true;
  }

  private def(key: string): SettingDefinition {
    const def = SETTINGS_SCHEMA[key];
    if (!def) throw new UnprocessableEntityException(`Unknown setting key: ${key}`);
    return def;
  }

  async get<T>(key: string): Promise<T> {
    const def = this.def(key);
    await this.ensureLoaded();
    return (this.cache.has(key) ? this.cache.get(key) : def.default) as T;
  }

  async getString(key: string): Promise<string> {
    return this.get<string>(key);
  }

  async getNumber(key: string): Promise<number> {
    return this.get<number>(key);
  }

  async getBoolean(key: string): Promise<boolean> {
    return this.get<boolean>(key);
  }

  // Convenience accessors used across modules.
  getReservationTtlMinutes = () => this.getNumber('order.reservationTtlMinutes');
  getCodCap = () => this.getNumber('order.codCap');
  isShippingTaxable = () => this.getBoolean('tax.shippingTaxable');
  getReturnWindowDays = () => this.getNumber('returns.windowDays');

  /** Full effective settings (persisted value or default) for admin. */
  async getAllForAdmin(group?: string): Promise<
    {
      key: string;
      value: unknown;
      type: SettingType;
      group: string;
      isPublic: boolean;
      description: string;
    }[]
  > {
    await this.ensureLoaded();
    return Object.values(SETTINGS_SCHEMA)
      .filter((d) => !group || d.group === group)
      .map((d) => ({
        key: d.key,
        value: this.cache.has(d.key) ? this.cache.get(d.key) : d.default,
        type: d.type,
        group: d.group,
        isPublic: d.isPublic,
        description: d.description,
      }));
  }

  async getOneForAdmin(key: string) {
    const d = this.def(key);
    await this.ensureLoaded();
    return {
      key: d.key,
      value: this.cache.has(d.key) ? this.cache.get(d.key) : d.default,
      type: d.type,
      group: d.group,
      isPublic: d.isPublic,
      description: d.description,
    };
  }

  /** Public (non-secret) settings as a flat map for the storefront. */
  async getPublic(): Promise<Record<string, unknown>> {
    await this.ensureLoaded();
    const out: Record<string, unknown> = {};
    for (const d of Object.values(SETTINGS_SCHEMA)) {
      if (d.isPublic) out[d.key] = this.cache.has(d.key) ? this.cache.get(d.key) : d.default;
    }
    return out;
  }

  async upsert(key: string, value: unknown, updatedBy?: string): Promise<void> {
    const def = this.def(key);
    this.validateType(def, value);
    await this.repo.save({
      key,
      value,
      type: def.type,
      group: def.group,
      description: def.description,
      isPublic: def.isPublic,
      updatedBy: updatedBy ?? null,
    });
    this.cache.set(key, value);
  }

  async bulkUpsert(items: { key: string; value: unknown }[], updatedBy?: string): Promise<void> {
    // Validate all before writing any.
    for (const it of items) this.validateType(this.def(it.key), it.value);
    for (const it of items) await this.upsert(it.key, it.value, updatedBy);
  }

  private validateType(def: SettingDefinition, value: unknown): void {
    const fail = () => new BadRequestException(`Setting ${def.key} expects type ${def.type}`);
    switch (def.type) {
      case SettingType.STRING:
        if (typeof value !== 'string') throw fail();
        break;
      case SettingType.NUMBER:
        if (typeof value !== 'number' || Number.isNaN(value)) throw fail();
        break;
      case SettingType.BOOLEAN:
        if (typeof value !== 'boolean') throw fail();
        break;
      case SettingType.STRING_ARRAY:
        if (!Array.isArray(value) || value.some((v) => typeof v !== 'string')) throw fail();
        break;
      case SettingType.JSON:
        if (typeof value !== 'object' || value === null) throw fail();
        break;
    }
  }
}
