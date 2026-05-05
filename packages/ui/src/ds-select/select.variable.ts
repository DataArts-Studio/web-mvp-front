import { cva } from 'class-variance-authority';

const BASE_STYLE =
  'flex w-full items-center justify-between rounded-4 border bg-bg-1 outline-none transition-colors cursor-pointer h-[56px] px-[24px] text-body2';

export const COLOR_VARIANTS = {
  default: 'border-line-2 text-text-1',
  error: 'border-system-red text-system-red',
  disabled: 'border-line-3 bg-bg-3 text-line-3 cursor-not-allowed',
};

export const dsSelectVariants = cva(BASE_STYLE, {
  variants: {
    variant: COLOR_VARIANTS,
  },
  defaultVariants: {
    variant: 'default',
  },
});
