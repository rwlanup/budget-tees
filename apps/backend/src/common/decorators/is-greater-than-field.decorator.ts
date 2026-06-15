import {
  registerDecorator,
  type ValidationArguments,
  type ValidationOptions,
} from 'class-validator';

/**
 * Validates that this numeric property is strictly greater than another
 * property on the same object. Skips when either value is null/undefined
 * (combine with `@IsOptional()`); cross-payload checks (e.g. partial PATCH
 * where the other value lives in the DB) must be enforced in the service.
 */
export function IsGreaterThanField(property: string, validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isGreaterThanField',
      target: object.constructor,
      propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          const [otherName] = args.constraints as [string];
          const other = (args.object as Record<string, unknown>)[otherName];
          if (value == null || other == null) return true;
          if (typeof value !== 'number' || typeof other !== 'number') return true;
          return value > other;
        },
        defaultMessage(args: ValidationArguments): string {
          const [otherName] = args.constraints as [string];
          return `${args.property} must be greater than ${otherName}`;
        },
      },
    });
  };
}
