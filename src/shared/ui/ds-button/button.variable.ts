// ------------------------------------------------------------------
// Button Design System Type
// ------------------------------------------------------------------
type ButtonColorType = 'solid' | 'ghost' | 'text';
type ButtonStateType = 'default' | 'hover' | 'clicked';
type ButtonSizeType = 'large' | 'medium' | 'small';

// ------------------------------------------------------------------
// Button Design System (Tailwind Classes)
// ------------------------------------------------------------------
const sizes: Record<ButtonSizeType, string> = {
  large: 'h-14 px-6 text-lg rounded-lg',
  medium: 'h-12 px-5 text-base rounded-md',
  small: 'h-9 px-4 text-sm rounded',
};

// 각 상태별(State) 고정 클래스 정의
// 실제 컴포넌트에서는 `clsx`나 `classNames`로 조합하여 사용
const colors: Record<ButtonColorType, Record<ButtonStateType, string>> = {
  solid: {
    default: 'bg-primary text-white border border-transparent',
    hover: 'bg-green-2 text-white border-transparent', // 실제 사용시: hover:bg-green-2
    clicked: 'bg-green-1 text-white border-transparent', // 실제 사용시: active:bg-green-1
  },
  ghost: {
    default: 'bg-white text-primary border border-primary',
    hover: 'bg-white text-green-2 border-green-2', // 실제 사용시: hover:text-green-2 ...
    clicked: 'bg-white text-green-1 border-green-1', // 실제 사용시: active:text-green-1 ...
  },
  text: {
    default: 'bg-transparent text-primary border-none',
    hover: 'bg-transparent text-green-2 border-none', // 보통 텍스트 버튼은 hover시 배경색(bg-gray-50)을 약간 주기도 함
    clicked: 'bg-transparent text-green-1 border-none',
  },
};

export const btn = {
  sizes,
  colors,
};
