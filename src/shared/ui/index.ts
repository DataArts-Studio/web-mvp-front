// ------------------------------------------------------------------
// Export UI
// ------------------------------------------------------------------
export { Button } from '@/shared/ui/button';
export type { ButtonProps } from '@/shared/ui/button';
export { Input } from '@/shared/ui/input';
export type { InputProps } from '@/shared/ui/input';

export { Checkbox, useCheckbox } from '@/shared/ui/checkbox';
export type {
  CheckedState,
  CheckboxContextValue,
  CheckboxRootProps,
  CheckboxIndicatorProps,
} from '@/shared/ui/checkbox';

export { FormField, useFormField } from '@/shared/ui/form-field';
export type {
  FormFieldRootProps,
  FormFieldError,
  FormFieldControlProps,
  FormFieldContextValue,
} from '@/shared/ui/form-field/form-field';

export { Dialog, useDialog } from '@/shared/ui/dialog';
export type * from '@/shared/ui/dialog';

export { Avatar, useAvatar } from '@/shared/ui/avatar';
export type {
  AvatarRootProps,
  AvatarImageProps,
  AvatarFallbackProps,
  AvatarContextValue,
} from '@/shared/ui/avatar/avatar';

export { Select, useSelect } from '@/shared/ui/select';
export type {
  SelectRootProps,
  SelectTriggerProps,
  SelectContentProps,
  SelectItemProps,
  SelectValueProps,
} from '@/shared/ui/select/select';

// ------------------------------------------------------------------
// Export Layout
// ------------------------------------------------------------------
export { Container } from '@/shared/ui/container';
export type { ContainerProps } from '@/shared/ui/container';

// ------------------------------------------------------------------
// Export SR
// ------------------------------------------------------------------
export { VisuallyHidden, visuallyHiddenStyles } from '@/shared/ui/visually-hidden';
export type { VisuallyHiddenProps } from '@/shared/ui/visually-hidden';
