import React from 'react';

export interface MainContainerProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
  className?: string;
}

/* TODO: 추후 위젯으로 변경 */
export const MainContainer = ({ children, className, ...props }: MainContainerProps) => {
  return (
    <main className={className} {...props}>
      {children}
    </main>
  );
};
