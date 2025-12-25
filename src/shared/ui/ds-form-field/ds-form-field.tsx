import React, { ComponentProps, ReactNode } from 'react';

import { FormField, FormFieldError, cn, useFormField } from '@/shared';
import { CircleAlert } from 'lucide-react';

interface DsFormFieldProps extends ComponentProps<typeof FormField.Root> {
  children: ReactNode;
  error?: FormFieldError;
  className?: string;
}

const DsFormFieldRoot = ({ children, error, className }: DsFormFieldProps) => {
  return (
    <FormField.Root
      error={error}
      className={cn(className, 'flex w-full flex-col items-start gap-4')}
    >
      {children}
    </FormField.Root>
  );
};

interface DsFormFieldLabelProps extends ComponentProps<typeof FormField.Label> {
  srOnly?: boolean;
}

const DsFormFieldLabel = ({ srOnly, className, children, ...props }: DsFormFieldLabelProps) => {
  return (
    <FormField.Label
      className={[srOnly ? 'sr-only' : '', className].filter(Boolean).join(' ')}
      {...props}
    >
      {children}
    </FormField.Label>
  );
};

const DsFormFieldControl = ({
  children,
  className,
  ...props
}: ComponentProps<typeof FormField.Control>) => {
  return (
    <FormField.Control className={cn(className, 'w-full')} {...props}>
      {children}
    </FormField.Control>
  );
};

interface DsFormFieldMessageProps extends ComponentProps<typeof FormField.Message> {
  type?: 'error' | 'success' | 'warning' | 'default';
  message?: string;
}

const DsFormFieldMessage = ({ children }: ComponentProps<typeof FormField.Message>) => {
  const { invalid } = useFormField();
  if (!invalid) return null;
  return (
    <div className="flex items-center gap-2">
      <CircleAlert className={cn('w-4 h-4')}/>
      <FormField.Message>{children}</FormField.Message>
    </div>
  );
};

export const DsFormField = {
  Root: DsFormFieldRoot,
  Label: DsFormFieldLabel,
  Control: DsFormFieldControl,
  Message: DsFormFieldMessage,
};
