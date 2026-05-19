import type { Metric } from '@/entities/admin-dashboard';

type MetricsSectionProps = {
  metrics: Metric[];
};

export function MetricsSection({ metrics }: MetricsSectionProps) {
  return (
    <section aria-labelledby="metrics-title">
      <h2 id="metrics-title" className="tracking-zero mb-3 text-lg font-bold">
        주요 지표
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className="border-border shadow-1 rounded-lg border bg-white p-5">
            <div className="text-text-secondary text-sm font-medium">{metric.label}</div>
            <div className="mt-4 flex items-end gap-2">
              <span className="tracking-zero text-text-primary text-3xl font-bold">
                {metric.value}
              </span>
              {metric.unit ? (
                <span className="pb-1 text-sm font-semibold text-[#155DFC]">{metric.unit}</span>
              ) : null}
            </div>
            <div className="text-text-secondary mt-3 text-sm">{metric.helper}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
