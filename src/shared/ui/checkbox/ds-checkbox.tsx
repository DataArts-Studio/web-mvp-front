'use client';
import * as React from 'react';
import { Check } from 'lucide-react';

import { Checkbox, type CheckedState } from '@/shared/lib/primitives/checkbox';
import { cn } from '@/shared/utils';

export interface DsCheckboxProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'type'> {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  name?: string;
  value?: string;
  required?: boolean;
  ref?: React.Ref<HTMLButtonElement>;
}

export const DsCheckbox = (props: DsCheckboxProps) => {
  const { className, onCheckedChange, checked, defaultChecked, disabled, ...rest } = props;

  const handleCheckedChange = (state: CheckedState) => {
    if (state !== 'indeterminate') {
      onCheckedChange?.(state);
    }
  };

  return (
    <Checkbox.Root
      checked={checked}
      defaultChecked={defaultChecked}
      onCheckedChange={handleCheckedChange}
      disabled={disabled}
      className={cn(
        'inline-flex h-4 w-4 items-center justify-center rounded border border-gray-300 bg-white',
        'focus:ring-primary focus:outline-none focus:ring-2 focus:ring-offset-2',
        'data-[state=checked]:border-primary data-[state=checked]:bg-primary',
        'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50',
        className
      )}
      {...rest}
    >
      <Checkbox.Indicator>
        <Check className="h-3 w-3 text-white" />
      </Checkbox.Indicator>
    </Checkbox.Root>
  );
};