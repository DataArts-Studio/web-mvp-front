import { cva } from 'class-variance-authority';













const BASE_STYLE =
  'flex w-full items-center rounded-[8px] border bg-[#0C0D0E] outline-none transition-colors';

export const COLOR_VARIANTS = {
  default: 'border-[#2B2D31] text-white placeholder:text-white/70',

  focused: 'border-[#0BB57F] text-white placeholder:text-white',

  completed: 'border-[#2B2D31] text-white',

  disabled:
    'border-[#5C6370] bg-[#1E2024] text-[#5C6370] placeholder:text-[#5C6370] cursor-not-allowed',

  error: 'border-[#FC4141] text-[#FC4141] placeholder:text-[#FC4141]',
};

export const SIZE_VARIANTS = {
  medium: 'h-[56px] px-[24px] gap-[16px] text-[16px]',
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
