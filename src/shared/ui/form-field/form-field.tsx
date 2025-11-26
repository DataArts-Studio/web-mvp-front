'use client';
import React from 'react';

import { Slot } from '@/shared/lib/slot';

// ------------------------------------------------------------------
// Types & Context & Context Hook
// ------------------------------------------------------------------
type FormFieldError = { message?: string };

interface FormFieldContextValue {
  /* 식별자 */
  id: string;
  labelId: string;
  descriptionId: string;
  messageId: string;
  /* 에러 상태 및 에러 내용 */
  invalid: boolean;
  error?: FormFieldError;
  /* ETC */
  name?: string;
  disabled: boolean;
}

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);

const useFormFieldContext = () => {
  const context = React.useContext(FormFieldContext);
  if (!context) throw new Error('<FormField.*> component must be used within <FormField>');
  return context;
};

// ------------------------------------------------------------------
// Root Component (Provider)
// ------------------------------------------------------------------
interface FormFieldRootProps {
  children: React.ReactNode;
  error?: FormFieldError;
  name?: string;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
  disabled?: boolean;
}

const FormFieldRoot = ({
  children,
  name,
  error,
  disabled = false,
  className,
  ref,
  ...props
}: FormFieldRootProps) => {
  const id = React.useId();
  const contextValue: FormFieldContextValue = React.useMemo(
    () => ({
      id,
      labelId: `label-${id}`,
      descriptionId: `description-${id}`,
      messageId: `message-${id}`,
      invalid: !!error,
      error,
      name,
      disabled,
    }),
    [id, name, error, disabled]
  );

  return (
    <FormFieldContext.Provider value={contextValue}>
      <div ref={ref} data-disabled={disabled ? 'true' : undefined} className={className} {...props}>
        {children}
      </div>
    </FormFieldContext.Provider>
  );
};

// ------------------------------------------------------------------
// Label Component
// ------------------------------------------------------------------
const FormFieldLabel = ({ children, className, ref, ...props }: React.ComponentProps<'label'>) => {
  const { id, labelId, invalid, disabled } = useFormFieldContext();
  return (
    <label
      ref={ref}
      id={labelId}
      htmlFor={id}
      data-invalid={invalid ? 'true' : undefined}
      data-disabled={disabled ? 'true' : undefined}
      className={className}
      {...props}
    >
      {children}
    </label>
  );
};

// ------------------------------------------------------------------
// Control Component
// ------------------------------------------------------------------
interface FormFieldControlProps extends React.ComponentProps<'div'> {
  asChild?: boolean;
}

const FormFieldControl = ({ asChild, children, ...props }: FormFieldControlProps) => {
  const { id, descriptionId, messageId, invalid, labelId } = useFormFieldContext();

  // asChild가 true면 Slot, 아니면 div
  const Comp = asChild ? Slot : 'div';

  return (
    <Comp
      id={id}
      aria-describedby={!invalid ? descriptionId : `${descriptionId} ${messageId}`}
      aria-labelledby={labelId}
      aria-invalid={invalid}
      data-invalid={invalid}
      {...props}
    />
  );
};

// ------------------------------------------------------------------
// Message Component (Error)
// ------------------------------------------------------------------
const FormFiledMessage = ({ children, className, ref, ...props }: React.ComponentProps<'p'>) => {
  const { messageId, error, invalid } = useFormFieldContext();

  // 에러메세지 유효성 검사(내용이 있어도 에러 상태 아니면 안 보여줌)
  const body = error ? String(error.message) : children;
  if (!invalid) return null;

  return (
    <p ref={ref} id={messageId} data-invalid={invalid} className={className} {...props}>
      {body}
    </p>
  );
};

// ------------------------------------------------------------------
// Description Component
// ------------------------------------------------------------------
const FormFieldDescription = ({
  children,
  className,
  ref,
  ...props
}: React.ComponentProps<'p'>) => {
  const { descriptionId } = useFormFieldContext();
  return (
    <p ref={ref} id={descriptionId} className={className} {...props}>
      {children}
    </p>
  );
};

// ------------------------------------------------------------------
// Export UI
// ------------------------------------------------------------------
export const FormField = {
  Root: FormFieldRoot,
  Label: FormFieldLabel,
  Control: FormFieldControl,
  Message: FormFiledMessage,
  Description: FormFieldDescription,
};

// ------------------------------------------------------------------
// Export Types
// ------------------------------------------------------------------
export type { FormFieldRootProps, FormFieldError, FormFieldControlProps, FormFieldContextValue };

// ------------------------------------------------------------------
// Export Hook
// ------------------------------------------------------------------
export { useFormFieldContext as useFormField };