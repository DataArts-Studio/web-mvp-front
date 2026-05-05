import { dsInputVariants } from './input.variable';
import { VariantProps } from 'class-variance-authority';

export type DsInputVariant = VariantProps<typeof dsInputVariants>['variant'];
export type DsInputSize = VariantProps<typeof dsInputVariants>['uiSize'];
