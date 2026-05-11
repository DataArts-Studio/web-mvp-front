import React from 'react';

export type InputVariant = 'default' | 'error';
export type InputSize = 'small' | 'medium' | 'large';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  variant?: InputVariant;
  size?: InputSize;
}

export type SearchInputProps = Omit<InputProps, 'type'>;

const variantClassName: Record<InputVariant, string> = {
  default: 'border-line-2 bg-bg-1 text-text-1 placeholder:text-text-2 hover:border-line-3 focus-visible:border-primary',
  error: 'border-system-red bg-bg-1 text-text-1 placeholder:text-system-red focus-visible:border-system-red focus-visible:outline-system-red',
};

const sizeClassName: Record<InputSize, string> = {
  small: 'h-8 px-3 text-sm',
  medium: 'h-10 px-4 text-base',
  large: 'h-12 px-5 text-base',
};

const searchIconPaddingClassName: Record<InputSize, string> = {
  small: 'pl-9',
  medium: 'pl-10',
  large: 'pl-11',
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    'aria-invalid': ariaInvalid,
    className,
    disabled,
    size = 'medium',
    type = 'text',
    variant = 'default',
    ...props
  },
  ref,
) {
  const invalid = variant === 'error' || ariaInvalid === true || ariaInvalid === 'true';
  const inputClassName = [
    'flex w-full rounded-button border border-solid font-normal transition-colors',
    'outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
    'disabled:cursor-not-allowed disabled:border-line-3 disabled:bg-bg-3 disabled:text-line-3 disabled:placeholder:text-line-3 disabled:opacity-70',
    variantClassName[variant],
    sizeClassName[size],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <input
      ref={ref}
      type={type}
      aria-invalid={invalid || undefined}
      disabled={disabled}
      className={inputClassName}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { className, size = 'medium', ...props },
  ref,
) {
  return (
    <span className="relative block w-full">
      <span className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 text-icon-default">
        <SearchIcon />
      </span>
      <Input
        ref={ref}
        type="search"
        size={size}
        className={[searchIconPaddingClassName[size], className].filter(Boolean).join(' ')}
        {...props}
      />
    </span>
  );
});

SearchInput.displayName = 'SearchInput';

function SearchIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}
