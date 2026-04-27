import { dsInputVariants } from '@/shared/ui/ds-input/input.variable';
import { VariantProps } from 'class-variance-authority';

export type DsInputVariant = VariantProps<typeof dsInputVariants>['variant'];
export type DsInputSize = VariantProps<typeof dsInputVariants>['uiSize'];
