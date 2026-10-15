import type { MilestoneWithStats } from '@/entities/milestone';

/** 목록 묶음. progress_status 는 생성 뒤 바뀌지 않아 기간과 진행으로 판정한다. */
export type MilestonePhase = 'inProgress' | 'planned' | 'done';
export type MilestoneListTab = 'all' | MilestonePhase;
/** 상태 알약. 진행 중은 목표일을 넘겼는지로 순조로움·지연을 가른다. */
export type MilestoneHealth = 'onTrack' | 'delayed' | 'planned' | 'done';

export const PHASE_ORDER: MilestonePhase[] = ['inProgress', 'planned', 'done'];

const DAY_MS = 24 * 60 * 60 * 1000;

const toUtc = (dateOnly: string) => {
  const [y, m, d] = dateOnly.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

/** 'YYYY-MM-DD' 두 날짜 사이 일수 (to - from). */
export const daysBetween = (from: string, to: string) =>
  Math.round((toUtc(to) - toUtc(from)) / DAY_MS);

/** 'YYYY-MM-DD' → 'MM.DD' */
export const formatMonthDay = (dateOnly: string) =>
  `${dateOnly.slice(5, 7)}.${dateOnly.slice(8, 10)}`;

export const milestonePhaseOf = (m: MilestoneWithStats, today: string): MilestonePhase => {
  if (m.progressStatus === 'done') return 'done';
  if (m.totalCases > 0 && m.completedCases >= m.totalCases) return 'done';
  if (m.startDate && today < m.startDate) return 'planned';
  if (!m.startDate && m.runCount === 0) return 'planned';
  return 'inProgress';
};

export const milestoneHealthOf = (m: MilestoneWithStats, today: string): MilestoneHealth => {
  const phase = milestonePhaseOf(m, today);
  if (phase !== 'inProgress') return phase;
  return m.endDate && m.endDate < today ? 'delayed' : 'onTrack';
};

/** 기간 중 지난 비율(0~100). 시작·목표일이 모두 있어야 계산한다. */
export const elapsedPercentOf = (m: MilestoneWithStats, today: string): number | null => {
  if (!m.startDate || !m.endDate) return null;
  const total = daysBetween(m.startDate, m.endDate);
  if (total <= 0) return today >= m.endDate ? 100 : 0;
  const passed = daysBetween(m.startDate, today);
  return Math.min(100, Math.max(0, Math.round((passed / total) * 100)));
};

/** 범위 안에서 결과를 남긴 케이스 중 통과 비율. 결과가 없으면 null. */
export const passRateOf = (m: MilestoneWithStats): number | null =>
  m.completedCases > 0 ? Math.round((m.passCases / m.completedCases) * 100) : null;

export type DueHint = { text: string; tone: 'muted' | 'danger' } | null;

/** 목표일 아래 작은 문구. 진행 중은 남은 날, 예정은 시작까지 남은 날. */
export const dueHintOf = (m: MilestoneWithStats, today: string): DueHint => {
  const phase = milestonePhaseOf(m, today);
  if (phase === 'done') return null;
  if (phase === 'planned') {
    if (!m.startDate) return null;
    const days = daysBetween(today, m.startDate);
    return { text: days === 1 ? '내일 시작' : `${days}일 뒤 시작`, tone: 'muted' };
  }
  if (!m.endDate) return null;
  const days = daysBetween(today, m.endDate);
  if (days < 0) return { text: `${-days}일 지남`, tone: 'danger' };
  if (days === 0) return { text: '오늘 마감', tone: 'muted' };
  return { text: `D-${days}`, tone: 'muted' };
};

/** 묶음 안 순서: 진행 중·예정은 다가오는 날짜 먼저, 완료는 최근 것 먼저. 날짜 없는 것은 뒤로. */
export const sortMilestones = (
  list: MilestoneWithStats[],
  phase: MilestonePhase
): MilestoneWithStats[] => {
  const keyOf = (m: MilestoneWithStats) => (phase === 'planned' ? m.startDate : m.endDate);
  return [...list].sort((a, b) => {
    const ka = keyOf(a);
    const kb = keyOf(b);
    if (ka === kb) return a.title.localeCompare(b.title);
    if (!ka) return 1;
    if (!kb) return -1;
    return phase === 'done' ? kb.localeCompare(ka) : ka.localeCompare(kb);
  });
};

export const groupMilestones = (list: MilestoneWithStats[], today: string) => {
  const groups: Record<MilestonePhase, MilestoneWithStats[]> = {
    inProgress: [],
    planned: [],
    done: [],
  };
  for (const m of list) groups[milestonePhaseOf(m, today)].push(m);
  for (const phase of PHASE_ORDER) groups[phase] = sortMilestones(groups[phase], phase);
  return groups;
};
