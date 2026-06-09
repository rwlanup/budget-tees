import { IsDefined } from 'class-validator';

export class UpsertSettingDto {
  /** Validated against the registered setting's type in the service. */
  @IsDefined()
  value: unknown;
}
