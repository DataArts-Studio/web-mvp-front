"use client";
import React from 'react';

interface InputProps extends React.ComponentProps<'input'> {
  ref?: React.Ref<HTMLInputElement>;
  invalid?: boolean;
}

const Input = ({
  invalid,
  disabled,
  onFocus,
  onBlur,
  ref,
  ...rest
}: InputProps) => {
  const [focused, setFocused] = React.useState(false);

  const handleFocus: React.FocusEventHandler<HTMLInputElement> = (e) => {
    setFocused(true);
    onFocus?.(e);
  };

  const handleBlur: React.FocusEventHandler<HTMLInputElement> = (e) => {
    setFocused(false);
    onBlur?.(e);
  };

  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      disabled={disabled}
      data-disabled={disabled ? '' : undefined}
      data-invalid={invalid ? '' : undefined}
      data-focused={focused ? '' : undefined}
      onFocus={handleFocus}
      onBlur={handleBlur}
      {...rest}
    />
  );
};

export { Input };
export type { InputProps };