import { cva } from 'class-variance-authority';

const BASE_STYLE = 'flex w-full items-center rounded-4 border bg-bg-1 outline-none transition-colors data-[focused]:border-primary';

export const COLOR_VARIANTS = {
  default: 'border-line-2 text-text-1 placeholder:text-text-2',
  completed: 'border-line-2 text-text-1',
  disabled: 'border-line-3 bg-bg-3 text-line-3 placeholder:text-line-3 cursor-not-allowed',
  error: 'border-system-red text-system-red placeholder:text-system-red',
};

export const SIZE_VARIANTS = {
  medium: 'h-[56px] px-[24px] gap-[16px] text-body2',
};

export const dsInputVariants = cva(BASE_STYLE, {
  variants: {
    variant: COLOR_VARIANTS,
    uiSize: SIZE_VARIANTS,
  },
  defaultVariants: {
    uiSize: 'medium',
    variant: 'default',
  },
});
