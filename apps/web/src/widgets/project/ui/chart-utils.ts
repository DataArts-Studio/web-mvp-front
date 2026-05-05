export const STATUS_COLORS = {
  pass: '#0BB57F',
  fail: '#FC4141',
  blocked: '#FBA900',
  untested: '#3B3E44',
} as const;

export const STATUS_LABELS = {
  pass: 'Passed',
  fail: 'Failed',
  blocked: 'Blocked',
  untested: 'Not Run',
} as const;

export type StatusKey = keyof typeof STATUS_COLORS;

export type TestStatusData = {
  pass: number;
  fail: number;
  blocked: number;
  untested: number;
};

export type ChartSegment = {
  key: StatusKey;
  value: number;
  color: string;
  label: string;
  percentage: number;
};

export type ArcSegment = ChartSegment & {
  path: string;
};

export const STATUS_KEYS: readonly StatusKey[] = ['pass', 'fail', 'blocked', 'untested'] as const;

export const RADIUS = 106;
export const VIEW_SIZE = RADIUS * 2;
export const GAP_DEGREES = 0;

export function buildSegments(data: TestStatusData, total: number): ChartSegment[] {
  return STATUS_KEYS
    .map((key) => ({
      key,
      value: data[key],
      color: STATUS_COLORS[key],
      label: STATUS_LABELS[key],
      percentage: total > 0 ? (data[key] / total) * 100 : 0,
    }))
    .filter((s) => s.value > 0);
}

export function buildArcs(segments: ChartSegment[], total: number): ArcSegment[] {
  const totalGapDegrees = segments.length * GAP_DEGREES;
  const availableDegrees = 360 - totalGapDegrees;
  const cx = VIEW_SIZE / 2;
  const cy = VIEW_SIZE / 2;
  let cumulativeAngle = -90; // 12시 방향 시작

  return segments.map((seg, i) => {
    const segDegrees = (seg.value / total) * availableDegrees;
    const startAngle = cumulativeAngle + (i > 0 ? GAP_DEGREES : 0);
    const endAngle = startAngle + segDegrees;
    cumulativeAngle = endAngle;

    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const largeArc = segDegrees > 180 ? 1 : 0;

    const x1 = cx + RADIUS * Math.cos(startRad);
    const y1 = cy + RADIUS * Math.sin(startRad);
    const x2 = cx + RADIUS * Math.cos(endRad);
    const y2 = cy + RADIUS * Math.sin(endRad);

    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    return { ...seg, path };
  });
}
