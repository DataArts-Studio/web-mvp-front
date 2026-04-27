import React from 'react';

import { Slot } from '@/shared/lib';

// ----------------------------------------------
// Interfaces Export
// ----------------------------------------------
export interface FormRootProps extends React.ComponentProps<'form'> {}

export interface FormItemProps extends React.ComponentProps<'div'> {}

export interface FormLabelProps extends React.ComponentProps<'label'> {
  invalid?: boolean;
}

export interface FormControlProps extends React.ComponentProps<'div'> {
  invalid?: boolean;
  asChild?: boolean;
}

export interface FormErrorMessageProps extends React.ComponentProps<'p'> {
  error?: string;
}

// ----------------------------------------------
// Root(단순 form 래퍼)
// ----------------------------------------------
const FormRoot = ({ ref, className, children, ...props }: FormRootProps) => {
  return (
    <form ref={ref} className={className} {...props}>
      {children}
    </form>
  );
};

// ----------------------------------------------
// Label(invalid prop을 받아서 에러 시 빨간색으로 변하게 처리)
// ----------------------------------------------
const FormLabel = ({ className, invalid, ref, ...props }: FormLabelProps) => {
  return (
    <label
      ref={ref}
      data-invalid={invalid ? '' : undefined}
      className={className}
      {...props}
    />
  );
};

// ----------------------------------------------
// Control (인풋 감싸는 용도)
// ----------------------------------------------
const FormControl = ({ ref, invalid, className, asChild = false, ...props }: FormControlProps) => {
  const Comp = asChild ? Slot : 'div';
  return <Comp ref={ref} aria-invalid={invalid} data-invalid={invalid ? '' : undefined} className={className} {...props} />;
};

// ----------------------------------------------
// Error Message (에러 메시지 출력)
// ----------------------------------------------
const FormErrorMessage = ({ className, error, children, ref, ...props }: FormErrorMessageProps) => {
  const body = error || children;
  if (!body) return null;

  return (
    <p ref={ref} role="alert" data-invalid="" className={className} {...props}>
      {body}
    </p>
  );
};

// ----------------------------------------------
// Export (Namespace)
// ----------------------------------------------
export const Form = {
  Root: FormRoot,
  Label: FormLabel,
  Control: FormControl,
  ErrorMessage: FormErrorMessage,
};
