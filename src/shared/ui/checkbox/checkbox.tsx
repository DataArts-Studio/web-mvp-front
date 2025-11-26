'use client';
import React from 'react';

// ------------------------------------------------------------------
// Types & Context & Context Hook
// ------------------------------------------------------------------
type CheckedState = boolean | 'indeterminate';

interface CheckboxContextValue {
  state: CheckedState;
  disabled: boolean;
}

const CheckboxContext = React.createContext<CheckboxContextValue | null>(null);

const useCheckboxContext = () => {
  const context = React.useContext(CheckboxContext);
  if (!context) throw new Error('<Checkbox.*> component must be used within <Checkbox>');
  return context;
};

// ------------------------------------------------------------------
// Root Component (Provider)
// ------------------------------------------------------------------
interface CheckboxRootProps extends Omit<React.LabelHTMLAttributes<HTMLLabelElement>, 'onChange'> {
  checked?: CheckedState;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: CheckedState) => void;
  disabled?: boolean;
  name?: string;
  value?: string;
  required?: boolean;
  ref?: React.Ref<HTMLLabelElement>;
}

const CheckboxRoot = ({
  checked,
  defaultChecked,
  onCheckedChange,
  disabled = false,
  name,
  value,
  required,
  className,
  id,
  children,
  ref,
  ...props
}: CheckboxRootProps) => {
  const [internalChecked, setInternalChecked] = React.useState<CheckedState>(!!defaultChecked);
    const isControlled = checked !== undefined;
    const state = isControlled ? checked : internalChecked;
    const inputRef = React.useRef<HTMLInputElement>(null);

    // Indeterminate 상태 동기화
    React.useEffect(() => {
      if (inputRef.current) {
        inputRef.current.indeterminate = state === 'indeterminate';
      }
    }, [state]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const nextChecked = e.target.checked;
      if (!isControlled) setInternalChecked(nextChecked);
      onCheckedChange?.(nextChecked);
    };

    const contextValue = React.useMemo(() => ({ state, disabled }), [state, disabled]);

  return (
    <CheckboxContext.Provider value={contextValue}>
      <span
          ref={ref}
          data-state={state === 'indeterminate' ? 'indeterminate' : state ? 'checked' : 'unchecked'}
          data-disabled={disabled ? '' : undefined}
          className={className}
          {...props}
        >
          <input
            ref={inputRef}
            type="checkbox"
            name={name}
            value={value}
            required={required}
            disabled={disabled}
            checked={state === 'indeterminate' ? false : !!state}
            onChange={handleChange}
            className="sr-only"
          />
          {children}
        </span>
      </CheckboxContext.Provider>
  );
};

// ------------------------------------------------------------------
// Indicator Component (체크 표시 아이콘 래퍼)
// ------------------------------------------------------------------
interface CheckboxIndicatorProps extends React.HTMLAttributes<HTMLSpanElement> {
  /* 체크 안되어도 렌더링 할지 여부 */
  forceMount?: boolean;
  ref?: React.Ref<HTMLSpanElement>;
};

const CheckboxIndicator = ({children, forceMount ,ref, ...props}: CheckboxIndicatorProps) => {
  const { state, disabled } = useCheckboxContext();
    const isCheckedOrIndeterminate = state === true || state === 'indeterminate';
    if (!forceMount && !isCheckedOrIndeterminate) return null;

    return (
      <span
        ref={ref}
        data-state={state === 'indeterminate' ? 'indeterminate' : state ? 'checked' : 'unchecked'}
        data-disabled={disabled ? '' : undefined}
        {...props}
      >
        {children}
      </span>
    );
}

// ------------------------------------------------------------------
// Export (Dot Notation으로 묶기)
// ------------------------------------------------------------------
export const Checkbox = {
  Root: CheckboxRoot,
  Indicator: CheckboxIndicator,
};

// ------------------------------------------------------------------
// Export Types
// ------------------------------------------------------------------
export type { CheckedState, CheckboxContextValue, CheckboxRootProps, CheckboxIndicatorProps };

// ------------------------------------------------------------------
// Export Hook
// ------------------------------------------------------------------
export { useCheckboxContext as useCheckbox };