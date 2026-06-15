import type { Alert, AlertSeverity } from '@/entities/admin-dashboard';

type AlertsSectionProps = {
  alerts: Alert[];
};

// 색상에만 의존하지 않도록 심각도를 텍스트 라벨로도 노출한다 (WCAG 1.4.1).
const SEVERITY_LABEL: Record<AlertSeverity, string> = {
  critical: '위험',
  warning: '경고',
  info: '안내',
};

export function AlertsSection({ alerts }: AlertsSectionProps) {
  return (
    <section aria-label="주의 알림" className="grid gap-3">
      {alerts.map((alert, index) => (
        <article
          key={`${alert.title}-${index}`}
          className={`rounded-lg border px-5 py-4 ${alert.tone}`}
        >
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-current px-2 py-0.5 text-xs font-bold">
              {SEVERITY_LABEL[alert.severity]}
            </span>
            <h3 className="font-semibold">{alert.title}</h3>
          </div>
          <p className="mt-1 text-sm opacity-90">{alert.description}</p>
        </article>
      ))}
    </section>
  );
}
