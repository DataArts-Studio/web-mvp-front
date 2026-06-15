import type { CostProject } from '@/entities/admin-dashboard';

type CostSpikeSectionProps = {
  costProjects: CostProject[];
};

export function CostSpikeSection({ costProjects }: CostSpikeSectionProps) {
  return (
    <section aria-labelledby="cost-spike-title" className="grid gap-6">
      <h2 id="cost-spike-title" className="tracking-zero text-lg font-bold">
        비용 급증 프로젝트
      </h2>
      <article
        aria-labelledby="cost-spike-title"
        className="border-border shadow-1 rounded-lg border bg-white p-5"
      >
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <caption className="sr-only">
              비용이 급증한 프로젝트의 오늘 비용, 어제 비용, 증가율, 누적 비용 목록
            </caption>
            <thead className="text-text-secondary text-left">
              <tr>
                <th scope="col" className="py-2 font-semibold">
                  프로젝트
                </th>
                <th scope="col" className="py-2 font-semibold">
                  오늘 비용
                </th>
                <th scope="col" className="py-2 font-semibold">
                  어제 비용
                </th>
                <th scope="col" className="py-2 font-semibold">
                  증가율
                </th>
                <th scope="col" className="py-2 font-semibold">
                  누적
                </th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {costProjects.map((project) => (
                <tr key={project[0]}>
                  {project.map((value, index) => (
                    <td
                      key={`${project[0]}-${index}`}
                      className={`py-3 ${index === 3 ? 'font-semibold text-red-700' : ''}`}
                    >
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}
