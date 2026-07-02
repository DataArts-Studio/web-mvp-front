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
  MIN_EVALUATED_RESULTS,
  MIN_CONFIDENCE_PASS_RATE,
  MAX_BLOCKED_RATE,
  RECENCY_DAYS,
  FLAKY_PASS_RATE_CEILING,
} from './lib/constants';
export type {
  AutomationStatus,
  CandidateRow,
  CandidateReasons,
  CandidateDecision,
  AutomationCandidatesStats,
  AutomationCandidatesResult,
  CoverageBySuite,
  AutomationCoverageResult,
  SetAutomationStatusInput,
  SetAutomationStatusResult,
} from './types';
