// ------------------------------------------------------------------
// Export UI
// ------------------------------------------------------------------
export { Button } from '@/shared/lib/primitives/button';
export type { ButtonProps } from '@/shared/lib/primitives/button';
export { Input } from '@/shared/lib/primitives/input';
export type { InputProps } from '@/shared/lib/primitives/input';

export { Checkbox, useCheckbox } from '@/shared/lib/primitives/checkbox';
export type {
  CheckedState,
  CheckboxContextValue,
  CheckboxRootProps,
  CheckboxIndicatorProps,
} from '@/shared/lib/primitives/checkbox';

export { FormField, useFormField } from '@/shared/lib/primitives/form-field';
export type {
  FormFieldRootProps,
  FormFieldError,
  FormFieldControlProps,
  FormFieldContextValue,
} from '@/shared/lib/primitives/form-field/form-field';

export { Dialog, useDialog } from '@/shared/lib/primitives/dialog';
export type {
  DialogRootProps,
  DialogTriggerProps,
  DialogPortalProps,
  DialogOverlayProps,
  DialogContentProps,
} from '@/shared/lib/primitives/dialog';

export { Avatar, useAvatar } from '@/shared/lib/primitives/avatar';
export type {
  AvatarRootProps,
  AvatarImageProps,
  AvatarFallbackProps,
  AvatarContextValue,
} from '@/shared/lib/primitives/avatar/avatar';

export { Select, useSelect } from '@/shared/lib/primitives/select';
export type {
  SelectRootProps,
  SelectTriggerProps,
  SelectContentProps,
  SelectItemProps,
  SelectValueProps,
} from '@/shared/lib/primitives/select/select';

// ------------------------------------------------------------------
// Export Widgets
// ------------------------------------------------------------------
export { Header } from '@/shared/lib/primitives/header';

// ------------------------------------------------------------------
// Export Layout
// ------------------------------------------------------------------
export { Container } from '@/shared/lib/primitives/container';
export type { ContainerProps } from '@/shared/lib/primitives/container';

export { MainContainer} from '@/shared/lib/primitives/main-container';
export type { MainContainerProps } from '@/shared/lib/primitives/main-container';

// ------------------------------------------------------------------
// Export SR
// ------------------------------------------------------------------
export { VisuallyHidden, visuallyHiddenStyles } from '@/shared/lib/primitives/visually-hidden';
export type { VisuallyHiddenProps } from '@/shared/lib/primitives/visually-hidden';
