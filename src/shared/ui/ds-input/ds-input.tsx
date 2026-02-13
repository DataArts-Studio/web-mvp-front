import React from 'react';

import { Input, type InputProps } from '@/shared/lib/primitives/input';
import { dsInputVariants } from './input.variable';
import type { DsInputSize, DsInputVariant } from './types';

interface DsInputProps extends InputProps {
  variant?: DsInputVariant;
  uiSize?: DsInputSize;
}

export const DsInput = ({ className, variant, uiSize, ...props }: DsInputProps) => {
  return <Input className={dsInputVariants({ variant, uiSize, className })} {...props} />;
};
