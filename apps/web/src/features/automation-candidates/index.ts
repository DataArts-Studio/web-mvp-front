export { getAutomationCandidates, getAutomationCoverage, setAutomationStatus } from './api';
export {
  automationCandidatesKeys,
  useAutomationCandidates,
  useAutomationCoverage,
  useSetAutomationStatus,
} from './hooks';
export {
  MIN_DISTINCT_RUNS,
  MIN_PASS_RATE,
  RECENCY_DAYS,
  FLAKY_PASS_RATE_CEILING,
} from './lib/constants';
export type {
  AutomationStatus,
  CandidateRow,
  CandidateReasons,
  AutomationCandidatesStats,
  AutomationCandidatesResult,
  CoverageBySuite,
  AutomationCoverageResult,
  SetAutomationStatusInput,
  SetAutomationStatusResult,
} from './types';
