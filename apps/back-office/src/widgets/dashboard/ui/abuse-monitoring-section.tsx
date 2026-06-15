import type { AbuseSignal, RateLimitViolation, SignupMonitoring } from '@/entities/admin-dashboard';

type AbuseMonitoringSectionProps = {
  abuseSignals: AbuseSignal[];
  signupMonitoring: SignupMonitoring;
  rateLimitViolation: RateLimitViolation;
};

export function AbuseMonitoringSection({
  abuseSignals,
  signupMonitoring,
  rateLimitViolation,
}: AbuseMonitoringSectionProps) {
  return (
    <section aria-labelledby="abuse-monitoring-title" className="grid gap-6">
      <h2 id="abuse-monitoring-title" className="tracking-zero text-lg font-bold">
        어뷰징 및 이상 행동 모니터링
      </h2>
      <div className="grid gap-6 xl:grid-cols-2">
        {abuseSignals.map((signal, index) => {
          const titleId = `abuse-signal-${index}-title`;

          return (
            <section
              key={`${signal.title}-${index}`}
              aria-labelledby={titleId}
              className="border-border rounded-xl border bg-white p-6 xl:p-8"
            >
              <h3 id={titleId} className="text-xl font-bold">
                {signal.title}
              </h3>
              <div className="mt-5 grid gap-4">
                {signal.items.map((item, itemIndex) => (
                  <div
                    key={`${item.title}-${itemIndex}`}
                    className={`rounded-lg border p-4 ${item.tone}`}
                  >
                    <div className="flex flex-col gap-2">
                      <div className="text-text-primary font-semibold">{item.title}</div>
                      <div className="text-text-secondary text-xs">{item.description}</div>
                      <div className="text-right text-xl font-bold">{item.value}</div>
                      {item.helper ? (
                        <div className="text-text-secondary text-sm">{item.helper}</div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
              <div className="text-text-secondary mt-3 text-xs">{signal.footnote}</div>
            </section>
          );
        })}

        <section
          aria-labelledby="signup-ip-monitoring-title"
          className="border-border rounded-xl border bg-white p-6 xl:p-8"
        >
          <h3 id="signup-ip-monitoring-title" className="text-xl font-bold">
            가입 및 IP 모니터링
          </h3>
          <div className="mt-5 grid gap-5">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-text-secondary text-base">신규 가입 (24시간)</div>
                  <div className="mt-2 text-4xl font-bold">
                    {signupMonitoring.newSignups.count}{' '}
                    <span className="text-text-secondary text-base font-normal">
                      {signupMonitoring.newSignups.average}
                    </span>
                  </div>
                </div>
                <span
                  className={`rounded-md px-3 py-1 text-sm font-bold ${signupMonitoring.newSignups.status.tone}`}
                >
                  {signupMonitoring.newSignups.status.label}
                </span>
              </div>
            </div>
            <div className="border-border border-t pt-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="text-text-secondary text-base">동일 IP 다중 계정</div>
                <span
                  className={`rounded-md px-3 py-1 text-sm font-bold ${signupMonitoring.duplicateIp.status.tone}`}
                >
                  {signupMonitoring.duplicateIp.status.label}
                </span>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="font-mono text-sm">{signupMonitoring.duplicateIp.ip}</div>
                <div className="text-text-secondary mt-2 text-sm">
                  {signupMonitoring.duplicateIp.description} ·{' '}
                  <span className="font-semibold text-red-600">
                    {signupMonitoring.duplicateIp.action}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="rate-limit-violation-title"
          className="border-border rounded-xl border bg-white p-6 xl:p-8"
        >
          <h3 id="rate-limit-violation-title" className="text-xl font-bold">
            Rate Limit 위반
          </h3>
          <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{rateLimitViolation.source}</div>
                <div className="text-text-secondary mt-1 text-sm">{rateLimitViolation.period}</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-orange-600">{rateLimitViolation.count}</div>
                <div className="text-text-secondary text-sm">{rateLimitViolation.note}</div>
              </div>
            </div>
          </div>
          <div className="text-text-secondary mt-5 text-sm">{rateLimitViolation.footnote}</div>
        </section>
      </div>
    </section>
  );
}
