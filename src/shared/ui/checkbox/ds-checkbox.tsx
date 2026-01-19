'use client';
import * as React from 'react';



import { cn } from '@/shared/utils';

export interface DsCheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onCheckedChange?: (checked: boolean) => void;
  ref?: React.Ref<HTMLInputElement>;
}

export const DsCheckbox = (props: DsCheckboxProps) => {
  const { className, onCheckedChange, checked, ref, ...rest } = props;

  return (
    <input
      type="checkbox"
      ref={ref}
      className={cn('text-primary focus:ring-primary h-4 w-4 rounded border-gray-300', className)}
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      {...rest}
    />
  );
};