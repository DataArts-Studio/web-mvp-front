'use client';

import React, { createContext, type ReactNode, useContext } from 'react';

import { DSButton, DsCheckbox, LoadingSpinner, cn } from '@/shared';
import { ListChecks, Search, X, type LucideIcon } from 'lucide-react';

// ─── Context ───────────────────────────────────────────────

type SelectionModalContextValue = {
  onClose: () => void;
  isPending: boolean;
};

const SelectionModalContext = createContext<SelectionModalContextValue | null>(null);

const useSelectionModal = () => {
  const ctx = useContext(SelectionModalContext);
  if (!ctx) throw new Error('SelectionModal.* must be used within SelectionModal.Root');
  return ctx;
};

// ─── Root ──────────────────────────────────────────────────

interface SelectionModalRootProps {
  children: ReactNode;
  onClose: () => void;
  isPending?: boolean;
  className?: string;
}

const Root = ({ children, onClose, isPending = false, className }: SelectionModalRootProps) => (
  <SelectionModalContext.Provider value={{ onClose, isPending }}>
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <section
        className={cn(
          'bg-bg-1 rounded-4 relative flex max-h-[80vh] w-full max-w-[600px] flex-col overflow-hidden shadow-xl',
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </section>
    </div>
  </SelectionModalContext.Provider>
);

// ─── Loading ───────────────────────────────────────────────

interface SelectionModalLoadingProps {
  text?: string;
  className?: string;
}

const Loading = ({ text, className }: SelectionModalLoadingProps) => {
  const { isPending } = useSelectionModal();
  if (!isPending) return null;
  return (
    <div
      className={cn(
        'absolute inset-0 z-10 flex items-center justify-center rounded-4 bg-bg-1/80 backdrop-blur-sm',
        className,
      )}
    >
      <LoadingSpinner size="md" text={text} />
    </div>
  );
};

// ─── Header ────────────────────────────────────────────────

interface SelectionModalHeaderProps {
  title: string;
  subtitle?: ReactNode;
  className?: string;
}

const Header = ({ title, subtitle, className }: SelectionModalHeaderProps) => {
  const { onClose } = useSelectionModal();
  return (
    <header className={cn('border-line-2 flex items-center justify-between border-b px-6 py-4', className)}>
      <div>
        <h2 className="text-text-1 text-lg font-bold">{title}</h2>
        {subtitle && <p className="text-text-3 mt-1 text-sm">{subtitle}</p>}
      </div>
      <DSButton variant="ghost" size="small" onClick={onClose} className="p-2">
        <X className="h-5 w-5" />
      </DSButton>
    </header>
  );
};

// ─── Search ────────────────────────────────────────────────

interface SelectionModalSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

const SearchBar = ({ value, onChange, placeholder, className }: SelectionModalSearchProps) => (
  <div className={cn('border-line-2 border-b px-6 py-3', className)}>
    <div className="bg-bg-2 border-line-2 flex items-center gap-2 rounded-lg border px-3 py-2">
      <Search className="text-text-3 h-4 w-4" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-text-1 placeholder:text-text-3 w-full bg-transparent text-sm outline-none"
      />
    </div>
  </div>
);

// ─── Body ──────────────────────────────────────────────────

interface SelectionModalBodyProps {
  children: ReactNode;
  className?: string;
}

const Body = ({ children, className }: SelectionModalBodyProps) => (
  <div className={cn('flex-1 overflow-y-auto', className)}>{children}</div>
);

// ─── Empty ─────────────────────────────────────────────────

interface SelectionModalEmptyProps {
  icon?: LucideIcon;
  text: string;
  className?: string;
}

const Empty = ({ icon: Icon = ListChecks, text, className }: SelectionModalEmptyProps) => (
  <div className={cn('flex flex-col items-center justify-center gap-3 py-12', className)}>
    <Icon className="text-text-3 h-8 w-8" />
    <p className="text-text-3 text-sm">{text}</p>
  </div>
);

// ─── SelectAll ─────────────────────────────────────────────

interface SelectionModalSelectAllProps {
  checked: boolean;
  onCheckedChange: () => void;
  selectedCount: number;
  totalCount: number;
  className?: string;
}

const SelectAll = ({ checked, onCheckedChange, selectedCount, totalCount, className }: SelectionModalSelectAllProps) => (
  <div className={cn('border-line-2 bg-bg-2 sticky top-0 flex items-center gap-3 border-b px-6 py-2', className)}>
    <DsCheckbox checked={checked} onCheckedChange={onCheckedChange} className="h-5 w-5 border-line-2 bg-bg-3" />
    <span className="text-text-2 text-sm">
      전체 선택 ({selectedCount}/{totalCount})
    </span>
  </div>
);

// ─── ItemList ──────────────────────────────────────────────

interface SelectionModalItemListProps {
  children: ReactNode;
  className?: string;
}

const ItemList = ({ children, className }: SelectionModalItemListProps) => (
  <div className={cn('divide-line-2 divide-y', className)}>{children}</div>
);

// ─── Item ──────────────────────────────────────────────────

interface SelectionModalItemProps {
  checked: boolean;
  onToggle: () => void;
  children: ReactNode;
  className?: string;
}

const Item = ({ checked, onToggle, children, className }: SelectionModalItemProps) => (
  <div
    onClick={onToggle}
    className={cn('hover:bg-bg-2 flex cursor-pointer items-center gap-3 px-6 py-3 transition-colors', className)}
  >
    <DsCheckbox checked={checked} className="h-5 w-5 shrink-0 border-line-2 bg-bg-3" />
    <div className="min-w-0 flex-1">{children}</div>
  </div>
);

// ─── Footer ────────────────────────────────────────────────

interface SelectionModalFooterProps {
  selectedCount: number;
  submitLabel: string;
  pendingLabel?: string;
  onSubmit: () => void;
  submitDisabled?: boolean;
  className?: string;
}

const Footer = ({
  selectedCount,
  submitLabel,
  pendingLabel = '추가 중...',
  onSubmit,
  submitDisabled,
  className,
}: SelectionModalFooterProps) => {
  const { onClose, isPending } = useSelectionModal();
  return (
    <div className={cn('border-line-2 flex items-center justify-between border-t px-6 py-4', className)}>
      <span className="text-text-3 text-sm">{selectedCount}개 선택됨</span>
      <div className="flex gap-3">
        <DSButton type="button" variant="ghost" onClick={onClose} disabled={isPending}>
          취소
        </DSButton>
        <DSButton
          type="button"
          variant="solid"
          onClick={onSubmit}
          disabled={isPending || submitDisabled || selectedCount === 0}
        >
          {isPending ? pendingLabel : submitLabel}
        </DSButton>
      </div>
    </div>
  );
};

// ─── Compound Export ───────────────────────────────────────

export const SelectionModal = {
  Root,
  Loading,
  Header,
  Search: SearchBar,
  Body,
  Empty,
  SelectAll,
  ItemList,
  Item,
  Footer,
};
