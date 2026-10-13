export interface DsSelectOption {
  value: string;
  label: string;
}

export interface DsSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: DsSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  /** 콤보박스 버튼에 붙는 id. `<label htmlFor>` 나 FormField.Control asChild 로 이름을 연결할 때 쓴다. */
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
}
