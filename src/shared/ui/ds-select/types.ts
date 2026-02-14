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
}
