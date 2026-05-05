"use client";
import React from 'react';

interface InputProps extends React.ComponentProps<'input'> {
  ref?: React.Ref<HTMLInputElement>;
  invalid?: boolean;
  /** 에러 메시지나 설명 요소의 ID (aria-describedby) */
  describedBy?: string;
}

const Input = ({
  invalid,
  disabled,
  describedBy,
  required,
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
      aria-describedby={describedBy || undefined}
      aria-required={required || undefined}
      disabled={disabled}
      required={required}
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