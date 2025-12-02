import React from 'react';
import { Slot } from '@/shared/lib';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
  asChild?: boolean;
}

const Container = ({children, className, asChild, ...props}: ContainerProps) => {
  const Comp: any = asChild ? Slot : 'div';
  return <Comp className={className} {...props}>{children}</Comp>;
};

export { Container };
export type { ContainerProps };