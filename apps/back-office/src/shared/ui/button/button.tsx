import React from 'react';

export type ButtonVariant = 'primary' | 'outlined' | 'text';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variantClassName: Record<ButtonVariant, string> = {
  primary: 'border-transparent bg-primary text-white hover:bg-primary/90 active:bg-primary/80',
  outlined: 'border-primary bg-transparent text-primary hover:bg-primary/10 active:bg-primary/15',
  text: 'border-transparent bg-transparent text-primary hover:bg-primary/10 active:bg-primary/15',
};

const sizeClassName: Record<ButtonSize, string> = {
  small: 'h-button-sm px-3',
  medium: 'h-button-md px-4',
  large: 'h-button-lg px-6',
};

export const Button = ({
  children,
  className,
  disabled,
  leftIcon,
  rightIcon,
  size = 'medium',
  style,
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) => {
  return (
    <button
      type={type}
      disabled={disabled}
      className={[
        'rounded-button inline-flex items-center justify-center gap-2 border border-solid text-sm font-medium whitespace-nowrap transition-colors',
        'focus-visible:outline-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variantClassName[variant],
        sizeClassName[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
      {...props}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
};
