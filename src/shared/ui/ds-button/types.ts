import React from 'react';

import { type ButtonProps } from '@/shared/lib/primitives/button';
import { buttonVariants } from './button.variable';
import { type VariantProps } from 'class-variance-authority';

// ------------------------------------------------------------------
// Button Design System Type
// ------------------------------------------------------------------
export type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];
export type ButtonSize = VariantProps<typeof buttonVariants>['size'];

export interface DSButtonProps extends ButtonProps, VariantProps<typeof buttonVariants> {
  ref?: React.Ref<HTMLButtonElement>;
}
