'use client';
import * as React from 'react';
import { cn } from '@/shared';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onCheckedChange?: (checked: boolean) => void;
  ref?: React.Ref<HTMLInputElement>;
}

const Checkbox = (props: CheckboxProps) => {
  const { className, onCheckedChange, checked, ref, ...rest } = props;

  return (
    <input
      type="checkbox"
      ref={ref}
      className={cn(
        'h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary',
        className
      )}
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      {...rest}
    />
  );
};

export { Checkbox };
