import type { MilestoneWithStats } from '@/entities/milestone';

/** 목록 묶음. progress_status 는 생성 뒤 바뀌지 않아 기간과 진행으로 판정한다. */
export type MilestonePhase = 'inProgress' | 'planned' | 'done';
export type MilestoneListTab = 'all' | MilestonePhase;
/**
 * 상태 알약. 진행 중은 목표일을 넘겼으면 지연, 지금 속도로 목표일 안에 못 끝나면 위험,
 * 나머지는 순조로움이다.
 */
export type MilestoneHealth = 'onTrack' | 'atRisk' | 'delayed' | 'planned' | 'done';

export const PHASE_ORDER: MilestonePhase[] = ['inProgress', 'planned', 'done'];

const DAY_MS = 24 * 60 * 60 * 1000;

const toUtc = (dateOnly: string) => {
  const [y, m, d] = dateOnly.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};

/** 'YYYY-MM-DD' 두 날짜 사이 일수 (to - from). */
export const daysBetween = (from: string, to: string) =>
  Math.round((toUtc(to) - toUtc(from)) / DAY_MS);

export const addDays = (dateOnly: string, days: number) =>
  new Date(toUtc(dateOnly) + days * DAY_MS).toISOString().slice(0, 10);

/**
 * 시작일부터 오늘까지의 하루 평균 실행 건수로 남은 케이스를 끝내는 날.
 * 시작일이 없거나, 아직 실행이 없거나, 다 끝났으면 null.
 */
export const projectedFinishOf = (
  startDate: string | null,
  executed: number,
  total: number,
  today: string
): string | null => {
  if (!startDate || executed <= 0 || executed >= total) return null;
  const elapsed = daysBetween(startDate, today);
  if (elapsed <= 0) return null;
  return addDays(today, Math.ceil((total - executed) / (executed / elapsed)));
};

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

/**
 * expectedDate 를 넘기지 않으면 범위 집계(결과를 남긴 케이스 수)로 완료 예상일을 구한다.
 * 상세 화면은 진행 그래프와 같은 값을 쓰도록 그래프의 예상일을 넘긴다.
 */
export const milestoneHealthOf = (
  m: MilestoneWithStats,
  today: string,
  expectedDate: string | null = projectedFinishOf(
    m.startDate,
    m.completedCases,
    m.totalCases,
    today
  )
): MilestoneHealth => {
  const phase = milestonePhaseOf(m, today);
  if (phase !== 'inProgress') return phase;
  if (m.endDate && m.endDate < today) return 'delayed';
  if (m.endDate && expectedDate && expectedDate > m.endDate) return 'atRisk';
  return 'onTrack';
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
