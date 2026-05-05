export const LABEL_W = 180;
export const RIGHT_W = 140;
export const FIXED_W = LABEL_W + RIGHT_W;
export const VISIBLE_WEEK_COUNT = 6;
export const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** 주어진 날짜가 속한 주의 월요일을 반환 */
export const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const diffMs = (a: Date, b: Date) => a.getTime() - b.getTime();

export type WeekInfo = { label: string; start: Date };

export const getBarStyle = (
  startDate: string | null,
  endDate: string | null,
  visibleTimelineStart: Date,
  visibleTotalMs: number,
): { left: string; width: string } | null => {
  if (!startDate || !endDate) return null;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const leftPct = (diffMs(start, visibleTimelineStart) / visibleTotalMs) * 100;
  const widthPct = (diffMs(end, start) / visibleTotalMs) * 100;
  return {
    left: `${leftPct}%`,
    width: `${Math.max(1, widthPct)}%`,
  };
};

export type TimelineData = {
  weeks: WeekInfo[];
  timelineStart: Date;
  timelineEnd: Date;
  totalMs: number;
};

export const computeTimeline = (
  milestones: { startDate: string | null; endDate: string | null }[],
): TimelineData => {
  const now = new Date();
  let minDate = now;
  let maxDate = now;

  for (const m of milestones) {
    if (m.startDate) {
      const d = new Date(m.startDate);
      if (d < minDate) minDate = d;
    }
    if (m.endDate) {
      const d = new Date(m.endDate);
      if (d > maxDate) maxDate = d;
    }
  }

  const start = getWeekStart(new Date(minDate.getTime() - WEEK_MS));
  const rawEnd = new Date(maxDate.getTime() + WEEK_MS);
  const endWeekStart = getWeekStart(rawEnd);
  const end = new Date(endWeekStart.getTime() + WEEK_MS);

  const minWeeks = 6;
  const currentWeeks = Math.ceil(diffMs(end, start) / WEEK_MS);
  const finalEnd =
    currentWeeks < minWeeks
      ? new Date(start.getTime() + minWeeks * WEEK_MS)
      : end;

  const totalMs = diffMs(finalEnd, start);
  const weekCount = Math.ceil(totalMs / WEEK_MS);

  const weeks: WeekInfo[] = [];
  for (let i = 0; i < weekCount; i++) {
    const weekStart = new Date(start.getTime() + i * WEEK_MS);
    weeks.push({ label: `WEEK ${i + 1}`, start: weekStart });
  }

  return { weeks, timelineStart: start, timelineEnd: finalEnd, totalMs };
};
