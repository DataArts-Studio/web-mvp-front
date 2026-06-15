import type { Alert } from '@/entities/admin-dashboard';

type AlertsSectionProps = {
  alerts: Alert[];
};

export function AlertsSection({ alerts }: AlertsSectionProps) {
  return (
    <section aria-label="주의 알림" className="grid gap-3">
      {alerts.map((alert, index) => (
        <article
          key={`${alert.title}-${index}`}
          className={`rounded-lg border px-5 py-4 ${alert.tone}`}
        >
          <div className="font-semibold">{alert.title}</div>
          <div className="mt-1 text-sm opacity-90">{alert.description}</div>
        </article>
      ))}
    </section>
  );
}
