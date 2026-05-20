import { VariantProps } from 'class-variance-authority';

import { dsInputVariants } from './input.variable';

export type DsInputVariant = VariantProps<typeof dsInputVariants>['variant'];
export type DsInputSize = VariantProps<typeof dsInputVariants>['uiSize'];
