import React from 'react';

import { designTokens } from '../../tokens';

export type ButtonVariant = 'primary' | 'outlined' | 'text';
export type ButtonSize = keyof typeof designTokens.button.size;

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const getVariantStyle = (variant: ButtonVariant): React.CSSProperties => {
  if (variant === 'outlined') {
    return {
      backgroundColor: 'transparent',
      borderColor: designTokens.color.primary,
      color: designTokens.color.primary,
    };
  }

  if (variant === 'text') {
    return {
      backgroundColor: 'transparent',
      borderColor: 'transparent',
      color: designTokens.color.primary,
    };
  }

  return {
    backgroundColor: designTokens.color.primary,
    borderColor: 'transparent',
    color: designTokens.color.white,
  };
};

export const Button = ({
  children,
  disabled,
  leftIcon,
  rightIcon,
  size = 'medium',
  style,
  type = 'button',
  variant = 'primary',
  ...props
}: ButtonProps) => {
  const sizeTokens = designTokens.button.size[size];

  return (
    <button
      type={type}
      disabled={disabled}
      style={{
        alignItems: 'center',
        borderStyle: 'solid',
        borderWidth: 1,
        borderRadius: designTokens.button.radius,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex',
        fontSize: designTokens.typography.button.fontSize,
        fontWeight: designTokens.typography.button.fontWeight,
        gap: designTokens.spacing[2],
        height: sizeTokens.height,
        justifyContent: 'center',
        opacity: disabled ? 0.5 : 1,
        padding: sizeTokens.padding,
        transition: 'background-color 150ms ease, border-color 150ms ease, color 150ms ease',
        whiteSpace: 'nowrap',
        ...getVariantStyle(variant),
        ...style,
      }}
      {...props}
    >
      {leftIcon}
      {children}
      {rightIcon}
    </button>
  );
};
