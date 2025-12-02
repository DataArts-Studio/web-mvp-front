import React from 'react';

import { Slot } from '@/shared/lib/slot';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  asChild?: boolean;
  loading?: boolean;
  pressed?: boolean;
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
  children,
  ref,
  ...rest
}: ButtonProps) => {
  // const Component: any = asChild ? Slot : 'ds-button';
  const Component: React.ElementType = asChild ? Slot : 'button';
  const isDisabled = disabled || loading;
  return (
    <Component
      type={asChild ? undefined : (type ?? 'button')}
      disabled={asChild ? undefined : isDisabled}
      aria-busy={loading || undefined}
      aria-pressed={pressed || undefined}
      className={className}
      {...rest}
    >
      {children}
    </Component>
  );
};

export { Button };
export type { ButtonProps };
