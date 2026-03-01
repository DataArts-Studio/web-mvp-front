import { create } from 'zustand';
import type {
  ColumnMapping,
  ImportResult,
  ParseResult,
  ValidatedRow,
} from './schema';

export type WizardStep = 'upload' | 'mapping' | 'preview';
export type ImportStatus =
  | 'idle'
  | 'parsing'
  | 'ready'
  | 'importing'
  | 'success'
  | 'error';

interface ImportWizardState {
  step: WizardStep;
  isOpen: boolean;

  // Step 1
  file: File | null;
  parseResult: ParseResult | null;

  // Step 2
  columnMapping: ColumnMapping;

  // Step 3
  targetSuiteId: string | null;
  validatedRows: ValidatedRow[];

  // Status
  status: ImportStatus;
  result: ImportResult | null;
  error: string | null;

  // Actions
  open: () => void;
  close: () => void;
  reset: () => void;
  setStep: (step: WizardStep) => void;
  setFile: (file: File) => void;
  setParseResult: (result: ParseResult) => void;
  setColumnMapping: (mapping: ColumnMapping) => void;
  setTargetSuiteId: (suiteId: string) => void;
  setValidatedRows: (rows: ValidatedRow[]) => void;
  setStatus: (status: ImportStatus) => void;
  setResult: (result: ImportResult) => void;
  setError: (error: string | null) => void;
}

const initialState = {
  step: 'upload' as WizardStep,
  isOpen: false,
  file: null,
  parseResult: null,
  columnMapping: { name: '' },
  targetSuiteId: null,
  validatedRows: [],
  status: 'idle' as ImportStatus,
  result: null,
  error: null,
};

export const useImportWizard = create<ImportWizardState>((set) => ({
  ...initialState,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  reset: () => set({ ...initialState }),
  setStep: (step) => set({ step }),
  setFile: (file) => set({ file }),
  setParseResult: (parseResult) => set({ parseResult }),
  setColumnMapping: (columnMapping) => set({ columnMapping }),
  setTargetSuiteId: (targetSuiteId) => set({ targetSuiteId }),
  setValidatedRows: (validatedRows) => set({ validatedRows }),
  setStatus: (status) => set({ status }),
  setResult: (result) => set({ result }),
  setError: (error) => set({ error }),
}));
