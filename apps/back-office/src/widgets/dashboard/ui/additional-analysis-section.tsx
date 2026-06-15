import type { FunnelStep, StorageProject } from '@/entities/admin-dashboard';

type AdditionalAnalysisSectionProps = {
  funnel: FunnelStep[];
  storageProjects: StorageProject[];
};

export function AdditionalAnalysisSection({
  funnel,
  storageProjects,
}: AdditionalAnalysisSectionProps) {
  return (
    <section aria-labelledby="additional-analysis-title" className="grid gap-6">
      <h2 id="additional-analysis-title" className="tracking-zero text-lg font-bold">
        추가 분석
      </h2>
      <div className="grid gap-6 xl:grid-cols-2">
        <section
          aria-labelledby="first-run-funnel-title"
          className="border-border shadow-1 rounded-lg border bg-white p-5"
        >
          <h3 id="first-run-funnel-title" className="text-base font-semibold">
            가입부터 첫 Run 퍼널
          </h3>
          <div className="mt-6 grid gap-7">
            {funnel.map((item) => {
              // item[2]("92%")를 0~100으로 보정해 막대 width 와 aria 값을 일치시킨다.
              const percent = Math.min(100, Math.max(0, Number.parseFloat(item[2]) || 0));
              return (
                <div key={item[0]}>
                  <div className="mb-2 flex items-end justify-between gap-4">
                    <span className="text-text-secondary text-base">{item[0]}</span>
                    <span className="font-bold">
                      {item[1]}{' '}
                      <span className="text-text-secondary ml-5 font-normal">{item[2]}</span>
                    </span>
                  </div>
                  <div
                    className="h-3 overflow-hidden rounded-full bg-gray-100"
                    role="progressbar"
                    aria-label={`${item[0]} 전환율`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={percent}
                    aria-valuetext={item[2]}
                  >
                    <div
                      className="h-full rounded-full bg-[#155DFC]"
                      style={{ width: `${percent}%` }}
                      aria-hidden="true"
                    />
                  </div>
                  {item[3] ? (
                    <div className="mt-2 text-right text-sm text-red-600">↓ {item[3]}</div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        <section
          aria-labelledby="storage-usage-title"
          className="border-border shadow-1 rounded-lg border bg-white p-5"
        >
          <h3 id="storage-usage-title" className="text-base font-semibold">
            스토리지 사용량
          </h3>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg bg-gray-50 p-5">
              <div className="text-text-secondary text-sm">총 용량</div>
              <div className="mt-3 text-3xl font-bold">14.76 GB</div>
            </div>
            <div className="rounded-lg bg-gray-50 p-5">
              <div className="text-text-secondary text-sm">총 Row 수</div>
              <div className="mt-3 text-3xl font-bold">4,559,234</div>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            {storageProjects.map((project) => {
              const percent = Math.min(100, Math.max(0, project[2]));
              return (
                <div key={project[0]}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="font-medium">{project[0]}</span>
                    <span className="text-text-secondary">{project[1]}</span>
                  </div>
                  <div
                    className="h-2 overflow-hidden rounded-full bg-gray-100"
                    role="progressbar"
                    aria-label={`${project[0]} 스토리지 사용률`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={percent}
                    aria-valuetext={project[1]}
                  >
                    <div
                      className="h-full rounded-full bg-purple-600"
                      style={{ width: `${percent}%` }}
                      aria-hidden="true"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </section>
  );
}
