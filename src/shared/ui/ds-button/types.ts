import React from 'react';

import { ButtonProps } from '@/shared';
import { buttonVariants } from '@/shared/ui/ds-button/button.variable';
import { type VariantProps } from 'class-variance-authority';

// ------------------------------------------------------------------
// Button Design System Type
// ------------------------------------------------------------------
export type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];
export type ButtonSize = VariantProps<typeof buttonVariants>['size'];

export interface DSButtonProps extends ButtonProps, VariantProps<typeof buttonVariants> {
  ref?: React.Ref<HTMLButtonElement>;
}
