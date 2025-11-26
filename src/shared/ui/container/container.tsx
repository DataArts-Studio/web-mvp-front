import React from 'react';

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  className?: string;
}

const Container = ({children, className, ...props}: ContainerProps) => {
  return <div className={className} {...props}>{children}</div>;
};

export { Container };
export type { ContainerProps };