import { isPhoneNumber, registerDecorator, type ValidationOptions } from 'class-validator';
import { ALLOWED_PHONE_COUNTRIES } from '../config/phone-countries';

/**
 * Validates that the value is a phone number valid for one of
 * `ALLOWED_PHONE_COUNTRIES`. Rejects empty/non-string values — combine with
 * `@IsOptional()` for optional fields. Accepts national or E.164 input.
 */
export function IsAllowedPhoneNumber(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isAllowedPhoneNumber',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (typeof value !== 'string' || value.trim() === '') return false;
          return ALLOWED_PHONE_COUNTRIES.some((region) => isPhoneNumber(value, region));
        },
        defaultMessage(): string {
          return `Enter a valid phone number for: ${ALLOWED_PHONE_COUNTRIES.join(', ')}`;
        },
      },
    });
  };
}
