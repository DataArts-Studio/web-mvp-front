import React from 'react';

import { Input, type InputProps } from '@/shared';
import { dsInputVariants } from '@/shared/ui/ds-input/input.variable';
import type { DsInputSize, DsInputVariant } from '@/shared/ui/ds-input/types';

interface DsInputProps extends InputProps {
  variant?: DsInputVariant;
  uiSize?: DsInputSize;
}

export const DsInput = ({ className, variant, uiSize, ...props }: DsInputProps) => {
  return <Input className={dsInputVariants({ variant, uiSize, className })} {...props} />;
};
