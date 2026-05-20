import type { ResourceUsage, SystemStatus } from '@/entities/admin-dashboard';

type CostSystemSectionProps = {
  resourceUsages: ResourceUsage[];
  systemStatuses: SystemStatus[];
};

export function CostSystemSection({ resourceUsages, systemStatuses }: CostSystemSectionProps) {
  return (
    <section aria-labelledby="cost-system-title" className="grid gap-6">
      <h2 id="cost-system-title" className="tracking-zero text-lg font-bold">
        비용 및 시스템 상태
      </h2>
      <div className="grid gap-6 xl:grid-cols-3">
        <section
          aria-labelledby="monthly-ai-cost-title"
          className="border-border rounded-xl border bg-white p-6 xl:p-8"
        >
          <div className="mb-7 flex items-start justify-between">
            <h3 id="monthly-ai-cost-title" className="text-xl font-bold">
              AI 비용 (이번 달)
            </h3>
            <span className="text-3xl text-orange-600" aria-hidden="true">
              $
            </span>
          </div>
          <div>
            <div className="flex items-end justify-between">
              <div>
                <div className="text-4xl font-bold">
                  $1,858 <span className="text-2xl text-red-600">93%</span>
                </div>
                <div className="text-text-secondary mt-3 text-base">
                  예산: $2,000 / 남은 예산: <b className="text-red-600">$142</b>
                </div>
              </div>
            </div>
            <div
              className="mt-7 h-3 overflow-hidden rounded-full bg-gray-100"
              role="progressbar"
              aria-label="이번 달 AI 비용 예산 사용률"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={93}
              aria-valuetext="93 퍼센트"
            >
              <div className="h-full w-[93%] rounded-full bg-red-600" aria-hidden="true" />
            </div>
            <div className="text-text-secondary mt-4 flex justify-between text-base">
              <div>
                오늘: <b>$67</b>
              </div>
              <div>
                어제: <b>$59</b>
              </div>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="infrastructure-usage-title"
          className="border-border rounded-xl border bg-white p-6 xl:p-8"
        >
          <div className="mb-7 flex items-start justify-between">
            <h3 id="infrastructure-usage-title" className="text-xl font-bold">
              인프라 사용량
            </h3>
            <span className="text-3xl text-[#155DFC]" aria-hidden="true">
              %
            </span>
          </div>
          <div className="space-y-6">
            {resourceUsages.map((item) => (
              <div key={item.label}>
                <div className="mb-2 flex justify-between text-base">
                  <span className="text-text-secondary">{item.label}</span>
                  <span className="font-bold">{item.value}</span>
                </div>
                <div
                  className="h-3 overflow-hidden rounded-full bg-gray-100"
                  role="progressbar"
                  aria-label={`${item.label} 사용률`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={item.percent}
                  aria-valuetext={item.value}
                >
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{ width: `${item.percent}%` }}
                    aria-hidden="true"
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section
          aria-labelledby="system-health-title"
          className="border-border rounded-xl border bg-white p-6 xl:p-8"
        >
          <div className="mb-7 flex items-start justify-between">
            <h3 id="system-health-title" className="text-xl font-bold">
              시스템 헬스
            </h3>
            <span className="h-3 w-3 rounded-full bg-green-500" aria-hidden="true" />
          </div>
          <div className="grid gap-5">
            {systemStatuses.map(([label, value], index) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-text-secondary text-base">{label}</span>
                <span className={index < 3 ? 'font-bold text-green-600' : 'font-bold'}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </section>
  );
}
