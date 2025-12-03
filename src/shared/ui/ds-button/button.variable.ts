import { cva } from 'class-variance-authority';







// ------------------------------------------------------------------
// Button Design System (Tailwind Classes)
// 공통 기본 스타일 (Base Style)
// ------------------------------------------------------------------
const BASE_STYLE =
  'cursor-pointer inline-flex items-center justify-center whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50';

// ------------------------------------------------------------------
// 변형 스타일 (Variants) - Color
// ------------------------------------------------------------------
const COLOR_VARIANTS = {
  solid: 'bg-primary text-white hover:bg-[#27AE60] active:bg-[#145A32] border border-transparent',
  ghost:
    'bg-white text-primary border border-primary hover:text-[#27AE60] hover:border-[#27AE60] active:text-[#145A32] active:border-[#145A32]',
  text: 'bg-transparent text-primary hover:text-[#27AE60] active:text-[#145A32] border-none',
};

// ------------------------------------------------------------------
// 크기 스타일 (Sizes)
// ------------------------------------------------------------------
const SIZE_VARIANTS = {
  large: 'h-14 px-6 text-lg rounded-lg',
  medium: 'h-12 px-5 text-base rounded-md',
  small: 'h-9 px-4 text-sm rounded',
};

// ------------------------------------------------------------------
// CVA 조합 (Assembly)
// ------------------------------------------------------------------
export const buttonVariants = cva(BASE_STYLE, {
  variants: {
    variant: COLOR_VARIANTS,
    size: SIZE_VARIANTS,
  },
  defaultVariants: {
    variant: 'solid',
    size: 'medium',
  },
});
