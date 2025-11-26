import React from 'react';

import { Slot } from '@/shared/lib/slot';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  asChild?: boolean;
  loading?: boolean;
  pressed?: boolean;
  children?: React.ReactNode;
}

const Button = ({
  className,
  asChild,
  loading,
  pressed,
  type,
  disabled,
  children,
  ...rest
}: ButtonProps) => {
  // const Component: any = asChild ? Slot : 'button';
  const Component: React.ElementType = asChild ? Slot : 'button';
  const isDisabled = disabled || loading;
  return (
    <Component
      type={asChild ? undefined : (type ?? 'button')}
      disabled={asChild ? undefined : isDisabled}
      aria-busy={loading || undefined}
      aria-pressed={pressed || undefined}
      {...rest}
    >
      {children}
    </Component>
  );
};

export { Button };
export type { ButtonProps };
