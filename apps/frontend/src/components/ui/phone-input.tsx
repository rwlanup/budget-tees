'use client';

import * as React from 'react';
import PhoneInputBase, {
  type Country,
  type Props,
  getCountryCallingCode,
} from 'react-phone-number-input';
import flags from 'react-phone-number-input/flags';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { ALLOWED_PHONE_COUNTRIES, DEFAULT_PHONE_COUNTRY } from '@/config/phone';

export type PhoneInputProps = Omit<React.ComponentProps<'input'>, 'onChange' | 'value' | 'ref'> &
  Omit<
    Props<typeof PhoneInputBase>,
    'onChange' | 'value' | 'inputComponent' | 'countrySelectComponent' | 'flagComponent'
  > & {
    /** E.164 phone string (e.g. "+97798…"). */
    value?: string;
    /** Receives the E.164 string ("" when cleared). */
    onChange?: (value: string) => void;
    defaultCountry?: Country;
  };

/**
 * International phone field: a searchable country picker (flag + dial code) glued
 * to the national number input. Emits an E.164 string; defaults to Nepal. Built
 * on `react-phone-number-input` with the project's shadcn Popover/Command/Input.
 */
export function PhoneInput({
  className,
  value,
  onChange,
  defaultCountry = DEFAULT_PHONE_COUNTRY,
  ...props
}: PhoneInputProps) {
  return (
    <PhoneInputBase
      international
      countries={ALLOWED_PHONE_COUNTRIES}
      addInternationalOption={false}
      defaultCountry={defaultCountry}
      flagComponent={FlagComponent}
      countrySelectComponent={CountrySelect}
      inputComponent={NumberInput}
      smartCaret={false}
      className={cn('flex items-center', className)}
      value={value || undefined}
      onChange={(v) => onChange?.(v ?? '')}
      {...props}
    />
  );
}

/** National-number field — shadcn Input, seamlessly joined to the country button. */
const NumberInput = React.forwardRef<HTMLInputElement, React.ComponentProps<typeof Input>>(
  function NumberInput({ className, ...props }, ref) {
    return (
      <Input
        ref={ref}
        type="tel"
        className={cn('rounded-s-none focus:z-10', className)}
        {...props}
      />
    );
  },
);

type CountryEntry = { label: string; value: Country | undefined };

type CountrySelectProps = {
  disabled?: boolean;
  value: Country;
  options: CountryEntry[];
  onChange: (country: Country) => void;
};

function CountrySelect({ disabled, value: selected, options, onChange }: CountrySelectProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="Select country"
          disabled={disabled}
          className="h-10 shrink-0 gap-1.5 rounded-e-none border-e-0 px-3 focus:z-10"
        >
          <FlagComponent country={selected} countryName={selected} />
          <ChevronsUpDown className="size-4 opacity-50" aria-hidden />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search country…" />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {options
                .filter((o): o is { label: string; value: Country } => !!o.value)
                .map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    onSelect={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                  >
                    <FlagComponent country={option.value} countryName={option.label} />
                    <span className="flex-1 truncate">{option.label}</span>
                    <span className="text-sm text-muted-foreground tabular-nums">
                      +{getCountryCallingCode(option.value)}
                    </span>
                    <Check
                      className={cn(
                        'size-4',
                        option.value === selected ? 'opacity-100' : 'opacity-0',
                      )}
                      aria-hidden
                    />
                  </CommandItem>
                ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function FlagComponent({ country, countryName }: { country?: Country; countryName?: string }) {
  const Flag = country ? flags[country] : undefined;
  return (
    <span className="flex h-4 w-6 items-center justify-center overflow-hidden rounded-sm bg-muted [&_svg]:size-full">
      {Flag ? <Flag title={countryName ?? country ?? ''} /> : null}
    </span>
  );
}
