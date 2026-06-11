'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCategoryTree } from '../queries';
import { flattenTree } from '../types';

interface CategorySelectProps {
  value: string | undefined;
  onChange: (id: string) => void;
  placeholder?: string;
}

/** Single category picker — indented, sourced from the active category tree. */
export function CategorySelect({
  value,
  onChange,
  placeholder = 'Select category',
}: CategorySelectProps) {
  const { data: tree } = useCategoryTree();
  const options = flattenTree(tree ?? []);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map(({ category, depth }) => (
          <SelectItem key={category.id} value={category.id}>
            {`${'  '.repeat(depth)}${category.name}`}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
