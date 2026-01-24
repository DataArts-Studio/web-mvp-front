import React from 'react';

import { Slot } from '@/shared/lib/slot';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  asChild?: boolean;
  loading?: boolean;
  pressed?: boolean;
  ariaLabel?: string;
  children?: React.ReactNode;
  ref?: React.Ref<HTMLButtonElement>;
}

const Button = ({
  className,
  asChild,
  loading,
  pressed,
  type,
  disabled,
  ariaLabel,
  children,
  ref,
  ...rest
}: ButtonProps) => {
  // const Component: any = asChild ? Slot : 'ds-button';
  const Component: React.ElementType = asChild ? Slot : 'button';
  const isDisabled = disabled || loading;
  return (
    <Component
      ref={ref}
      type={asChild ? undefined : (type ?? 'button')}
      disabled={asChild ? undefined : isDisabled}
      aria-disabled={isDisabled || undefined}
      aria-busy={loading || undefined}
      aria-pressed={pressed || undefined}
      aria-label={ariaLabel || undefined}
      className={className}
      {...rest}
    >
      {children}
    </Component>
  );
};

export { Button };
export type { ButtonProps };
