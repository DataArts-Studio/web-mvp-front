'use client';

import { Button, Select } from '@/shared/ui';











































const alerts = [
  {
    title: 'AI 비용 예산 초과 위험 (93% 사용)',
    description: '이번 달 AI 비용: $1,858 / 예산: $2,000 · 7일 남음',
    tone: 'bg-red-50 text-red-700 border-red-200',
  },
  {
    title: 'Supabase 스토리지 한도 임박 (87%)',
    description: '현재 사용량: 8.7 GB / Free Tier 한도: 10 GB · 3개 프로젝트 정리 필요',
    tone: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    title: '비정상 사용 패턴 감지 (3건)',
    description: 'AI 호출 과다 사용자 2명, 동일 IP 다중 계정 1건 · 상세 확인',
    tone: 'bg-blue-50 text-blue-700 border-blue-200',
  },
];

const metrics = [
  { label: '활성 사용자', value: '1,247', unit: 'DAU', helper: 'WAU: 3,124 · MAU: 9,856' },
  { label: '신규 프로젝트 (주간)', value: '12', unit: '+33%', helper: '이전 주: 9개' },
  { label: '테스트 실행률 (7일)', value: '68.4%', unit: '', helper: '실행: 3,119 / 전체: 4,559' },
  { label: '프로젝트 유지율 (30일)', value: '92.3%', unit: '', helper: '활성: 143 / 비활성: 12' },
];

const activeProjects = [
  ['E-commerce Platform', '1,247', '523', '$42.50'],
  ['Mobile App Backend', '982', '401', '$31.80'],
  ['Payment Gateway', '856', '378', '$29.50'],
  ['User Management', '723', '312', '$24.40'],
  ['Analytics Dashboard', '654', '289', '$21.20'],
  ['Notification Service', '587', '245', '$18.90'],
  ['Search Engine', '521', '223', '$16.50'],
  ['Chat System', '478', '201', '$15.20'],
  ['File Storage', '412', '178', '$13.10'],
  ['API Gateway', '389', '156', '$12.40'],
];

const costProjects = [
  ['AI 챗봇 테스트', '$18.50', '$3.20', '+478%', '$127.40'],
  ['E-commerce QA', '$12.30', '$5.80', '+112%', '$245.60'],
  ['모바일 앱 테스트', '$8.90', '$4.50', '+98%', '$156.70'],
];

const storageProjects = [
  ['E-commerce Platform', '3.62 GB', 'w-[92%]'],
  ['Mobile App Backend', '2.65 GB', 'w-[72%]'],
  ['Payment Gateway', '2.07 GB', 'w-[58%]'],
  ['User Management', '1.48 GB', 'w-[44%]'],
  ['Analytics Dashboard', '1.33 GB', 'w-[39%]'],
];

const funnel = [
  ['프로젝트 생성', '1,520', '100.0%', ''],
  ['첫 TC 작성', '1,247', '82.0%', '18.0% 이탈'],
  ['첫 Run 실행', '1,089', '71.6%', '12.7% 이탈'],
  ['결과 확인', '978', '64.3%', '10.2% 이탈'],
];

const navItems = [
  {
    label: '대시보드',
    iconPath: 'M3 13h8V3H3v10Zm10 8h8V3h-8v18ZM3 21h8v-6H3v6Z',
  },
  {
    label: '프로젝트 관리',
    iconPath:
      'M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-9Z',
  },
  {
    label: '사용자 관리',
    iconPath:
      'M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8.5 3 2 2 3-4',
  },
  {
    label: '통계',
    iconPath: 'M4 19V9m5 10V5m5 14v-7m5 7V3',
  },
  {
    label: '설정',
    iconPath:
      'M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Zm0-12v2m0 13v2m8.5-8.5h-2m-13 0h-2m14.5-6.5-1.4 1.4m-9.2 9.2-1.4 1.4m0-12 1.4 1.4m9.2 9.2 1.4 1.4',
  },
];

const selectTriggerClassName =
  '!border-border !bg-white !text-text-primary hover:!border-[#155DFC] focus-visible:!outline-[#155DFC] data-[state=open]:!border-[#155DFC] data-[state=open]:!outline-[#155DFC] [&>svg]:!text-text-primary';

const selectValueClassName =
  '!text-text-primary data-[state=filled]:!text-text-primary data-[state=empty]:!text-text-secondary';

const selectContentClassName = '!border-border !bg-white !text-text-primary';

const selectItemClassName =
  '!text-text-primary data-[highlighted]:!bg-[#155DFC]/10 data-[highlighted]:!text-text-primary data-[state=checked]:!text-[#155DFC]';

export default function Home() {
  return (
    <main
      id="dashboard-main"
      aria-labelledby="dashboard-title"
      className="text-text-primary min-h-dvh flex-1 bg-gray-50"
    >
      <div className="min-h-dvh bg-gray-50 lg:pl-[240px]">
        <aside
          aria-label="Back office 사이드바"
          className="border-border fixed inset-y-0 left-0 hidden w-[240px] border-r bg-white lg:block"
        >
          <div className="border-border border-b px-6 py-5">
            <div className="tracking-zero text-xl font-bold">Testea</div>
            <div className="text-text-secondary mt-1 text-sm">관리자</div>
          </div>
          <nav aria-label="Back office 주요 메뉴" className="flex flex-col gap-1 px-3 py-4 text-sm">
            {navItems.map((item) => (
              <a
                key={item.label}
                aria-current={item.label === '대시보드' ? 'page' : undefined}
                className={[
                  'flex items-center gap-3 rounded-md px-3 py-2 font-medium transition-colors',
                  item.label === '대시보드'
                    ? 'bg-[#155DFC]/10 text-[#155DFC]'
                    : 'text-text-secondary hover:text-text-primary hover:bg-gray-100',
                ].join(' ')}
                href={item.label === '대시보드' ? '#dashboard-main' : '#'}
              >
                <svg
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={item.iconPath} />
                </svg>
                <span>{item.label}</span>
              </a>
            ))}
          </nav>
          <div className="border-border absolute bottom-0 hidden w-[239px] border-t px-6 py-4 text-sm lg:block">
            <div className="font-semibold">관리자</div>
            <div className="text-text-secondary mt-1">admin@testea.com</div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="border-border sticky top-0 z-10 border-b bg-white/95 px-5 py-4 backdrop-blur lg:px-8">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-xs font-semibold text-[#155DFC]">
                  [BO02] 사용량 및 분석 대시보드
                </p>
                <h1
                  id="dashboard-title"
                  className="tracking-zero text-text-primary mt-1 text-2xl font-bold"
                >
                  대시보드
                </h1>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <span className="text-text-secondary text-sm" aria-live="polite">
                  마지막 갱신: 7분 전
                </span>
                <div className="w-full sm:w-36">
                  <Select.Root defaultValue="30d" size="md">
                    <Select.Trigger aria-label="기간 선택" className={selectTriggerClassName}>
                      <Select.Value placeholder="기간" className={selectValueClassName} />
                    </Select.Trigger>
                    <Select.Content className={selectContentClassName}>
                      <Select.Item value="7d" className={selectItemClassName}>
                        최근 7일
                      </Select.Item>
                      <Select.Item value="30d" className={selectItemClassName}>
                        최근 30일
                      </Select.Item>
                      <Select.Item value="90d" className={selectItemClassName}>
                        최근 90일
                      </Select.Item>
                    </Select.Content>
                  </Select.Root>
                </div>
                <Button variant="outlined" className="bg-white">
                  내보내기
                </Button>
              </div>
            </div>
          </header>

          <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-5 py-6 lg:px-8">
            <section aria-label="주의 알림" className="grid gap-3">
              {alerts.map((alert) => (
                <article
                  key={alert.title}
                  className={`rounded-lg border px-5 py-4 ${alert.tone}`}
                >
                  <div className="font-semibold">{alert.title}</div>
                  <div className="mt-1 text-sm opacity-90">{alert.description}</div>
                </article>
              ))}
            </section>

            <section aria-labelledby="metrics-title">
              <h2 id="metrics-title" className="tracking-zero mb-3 text-lg font-bold">
                주요 지표
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="border-border shadow-1 rounded-lg border bg-white p-5"
                  >
                    <div className="text-text-secondary text-sm font-medium">{metric.label}</div>
                    <div className="mt-4 flex items-end gap-2">
                      <span className="tracking-zero text-text-primary text-3xl font-bold">
                        {metric.value}
                      </span>
                      {metric.unit ? (
                        <span className="pb-1 text-sm font-semibold text-[#155DFC]">
                          {metric.unit}
                        </span>
                      ) : null}
                    </div>
                    <div className="text-text-secondary mt-3 text-sm">{metric.helper}</div>
                  </div>
                ))}
              </div>
            </section>

            <h2 id="trend-title" className="tracking-zero text-lg font-bold">
              추이 분석
            </h2>
            <section aria-labelledby="trend-title" className="grid gap-6 xl:grid-cols-2">
              <div className="border-border rounded-xl border bg-white p-6 xl:p-8">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-xl font-bold">신규 프로젝트 추이</h3>
                  <div className="text-text-secondary flex items-center gap-3 text-xs">
                    <span>최근 30일</span>
                  </div>
                </div>
                <svg
                  className="h-72 w-full"
                  viewBox="0 0 760 285"
                  role="img"
                  aria-labelledby="new-projects-chart-title new-projects-chart-desc"
                >
                  <title id="new-projects-chart-title">신규 프로젝트 추이 차트</title>
                  <desc id="new-projects-chart-desc">
                    최근 30일 동안 생성된 신규 프로젝트 수를 날짜별 막대로 표시한 차트입니다.
                    세로축은 프로젝트 수, 가로축은 날짜입니다.
                  </desc>
                  <path d="M72 20V202H736" fill="none" stroke="#6b7280" strokeWidth="2" />
                  <path d="M72 202H736" fill="none" stroke="#6b7280" strokeWidth="2" />
                  {[20, 65, 110, 155, 200].map((y) => (
                    <path key={y} d={`M72 ${y}H736`} stroke="#e5e7eb" strokeDasharray="4 4" />
                  ))}
                  {[
                    ['4', 24],
                    ['3', 69],
                    ['2', 114],
                    ['1', 159],
                    ['0', 204],
                  ].map(([label, y]) => (
                    <text key={label} x="40" y={y} fill="#6b7280" fontSize="16" textAnchor="middle">
                      {label}
                    </text>
                  ))}
                  {[
                    ['3/31', 72],
                    ['4/2', 116],
                    ['4/4', 162],
                    ['4/6', 208],
                    ['4/8', 254],
                    ['4/10', 300],
                    ['4/12', 392],
                    ['4/14', 438],
                    ['4/16', 484],
                    ['4/18', 530],
                    ['4/20', 576],
                    ['4/22', 622],
                    ['4/24', 668],
                    ['4/26', 714],
                  ].map(([label, x]) => (
                    <text
                      key={label}
                      x={x}
                      y="228"
                      fill="#6b7280"
                      fontSize="15"
                      textAnchor="middle"
                    >
                      {label}
                    </text>
                  ))}
                  {[
                    ['84', '157', '45'],
                    ['116', '112', '90'],
                    ['162', '157', '45'],
                    ['208', '67', '135'],
                    ['254', '112', '90'],
                    ['300', '67', '135'],
                    ['346', '112', '90'],
                    ['392', '22', '180'],
                    ['438', '112', '90'],
                    ['484', '22', '180'],
                    ['530', '157', '45'],
                    ['576', '67', '135'],
                    ['622', '112', '90'],
                    ['668', '22', '180'],
                  ].map(([x, y, h]) => (
                    <rect
                      key={x}
                      x={x}
                      y={y}
                      width="22"
                      height={h}
                      rx="4"
                      fill="#155DFC"
                      opacity="0.85"
                    />
                  ))}
                </svg>
              </div>
              <div className="border-border rounded-xl border bg-white p-6 xl:p-8">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-xl font-bold">DAU / WAU / MAU 추이</h3>
                </div>
                <svg
                  className="h-72 w-full"
                  viewBox="0 0 620 285"
                  role="img"
                  aria-labelledby="active-users-chart-title active-users-chart-desc"
                >
                  <title id="active-users-chart-title">DAU, WAU, MAU 추이 차트</title>
                  <desc id="active-users-chart-desc">
                    DAU, WAU, MAU를 각각 파란색, 초록색, 보라색 선으로 표시한 사용자 추이 차트입니다.
                    세로축은 사용자 수, 가로축은 날짜입니다.
                  </desc>
                  <path d="M64 18V204H600" fill="none" stroke="#6b7280" strokeWidth="2" />
                  <path d="M64 204H600" fill="none" stroke="#6b7280" strokeWidth="2" />
                  {[20, 65, 110, 155, 200].map((y) => (
                    <path key={y} d={`M64 ${y}H600`} stroke="#e5e7eb" strokeDasharray="4 4" />
                  ))}
                  {[
                    ['14000', 24],
                    ['10500', 69],
                    ['7000', 114],
                    ['3500', 159],
                    ['0', 204],
                  ].map(([label, y]) => (
                    <text key={label} x="34" y={y} fill="#6b7280" fontSize="13" textAnchor="middle">
                      {label}
                    </text>
                  ))}
                  {[
                    ['3/30', 42],
                    ['4/1', 88],
                    ['4/3', 132],
                    ['4/5', 178],
                    ['4/7', 222],
                    ['4/9', 266],
                    ['4/11', 312],
                    ['4/13', 356],
                    ['4/15', 402],
                    ['4/17', 446],
                    ['4/19', 492],
                    ['4/21', 536],
                    ['4/23', 586],
                  ].map(([label, x]) => (
                    <text
                      key={label}
                      x={x}
                      y="228"
                      fill="#6b7280"
                      fontSize="14"
                      textAnchor="middle"
                    >
                      {label}
                    </text>
                  ))}
                  <polyline
                    points="64,188 88,178 132,183 178,161 222,166 266,148 312,136 356,141 402,122 446,112 492,118 536,98 586,86"
                    fill="none"
                    stroke="#155DFC"
                    strokeWidth="4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polyline
                    points="64,162 88,154 132,146 178,134 222,127 266,118 312,106 356,98 402,86 446,78 492,72 536,64 586,56"
                    fill="none"
                    stroke="#16A34A"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <polyline
                    points="64,112 88,106 132,98 178,90 222,84 266,76 312,68 356,62 402,52 446,44 492,38 536,32 586,24"
                    fill="none"
                    stroke="#9333ea"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <g transform="translate(188 262)">
                    <line x1="0" y1="0" x2="28" y2="0" stroke="#155DFC" strokeWidth="4" />
                    <text x="38" y="5" fill="#155DFC" fontSize="16">
                      DAU
                    </text>
                    <line x1="104" y1="0" x2="132" y2="0" stroke="#16A34A" strokeWidth="3" />
                    <text x="142" y="5" fill="#16A34A" fontSize="16">
                      WAU
                    </text>
                    <line x1="210" y1="0" x2="238" y2="0" stroke="#9333ea" strokeWidth="3" />
                    <text x="248" y="5" fill="#9333ea" fontSize="16">
                      MAU
                    </text>
                  </g>
                </svg>
              </div>
              <div className="border-border rounded-xl border bg-white p-6 xl:p-8">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-xl font-bold">콘텐츠 생산성</h3>
                  <div className="w-32">
                    <Select.Root defaultValue="누적" size="md">
                      <Select.Trigger
                        aria-label="콘텐츠 생산성 집계 기준"
                        className={selectTriggerClassName}
                      >
                        <Select.Value placeholder="집계 기준" className={selectValueClassName} />
                      </Select.Trigger>
                      <Select.Content className={selectContentClassName}>
                        <Select.Item value="누적" className={selectItemClassName}>
                          누적
                        </Select.Item>
                        <Select.Item value="일별" className={selectItemClassName}>
                          일별
                        </Select.Item>
                        <Select.Item value="주간" className={selectItemClassName}>
                          주간
                        </Select.Item>
                        <Select.Item value="월간" className={selectItemClassName}>
                          월간
                        </Select.Item>
                      </Select.Content>
                    </Select.Root>
                  </div>
                </div>
                <svg
                  className="h-72 w-full"
                  viewBox="0 0 620 285"
                  role="img"
                  aria-labelledby="content-productivity-chart-title content-productivity-chart-desc"
                >
                  <title id="content-productivity-chart-title">콘텐츠 생산성 차트</title>
                  <desc id="content-productivity-chart-desc">
                    TC, Suite, Run, Milestone 누적 생산량을 색상별 선과 영역으로 표시한 차트입니다.
                    세로축은 생성 수, 가로축은 날짜입니다.
                  </desc>
                  <path d="M64 18V204H600" fill="none" stroke="#6b7280" strokeWidth="2" />
                  <path d="M64 204H600" fill="none" stroke="#6b7280" strokeWidth="2" />
                  {[20, 65, 110, 155, 200].map((y) => (
                    <path key={y} d={`M64 ${y}H600`} stroke="#e5e7eb" strokeDasharray="4 4" />
                  ))}
                  {[
                    ['12000', 24],
                    ['9000', 69],
                    ['6000', 114],
                    ['3000', 159],
                    ['0', 204],
                  ].map(([label, y]) => (
                    <text key={label} x="34" y={y} fill="#6b7280" fontSize="13" textAnchor="middle">
                      {label}
                    </text>
                  ))}
                  {[
                    ['3/30', 42],
                    ['4/1', 88],
                    ['4/3', 132],
                    ['4/5', 178],
                    ['4/7', 222],
                    ['4/9', 266],
                    ['4/11', 312],
                    ['4/13', 356],
                    ['4/15', 402],
                    ['4/17', 446],
                    ['4/19', 492],
                    ['4/21', 536],
                    ['4/23', 586],
                  ].map(([label, x]) => (
                    <text
                      key={label}
                      x={x}
                      y="228"
                      fill="#6b7280"
                      fontSize="14"
                      textAnchor="middle"
                    >
                      {label}
                    </text>
                  ))}
                  <polygon
                    points="64,202 64,194 90,180 138,170 186,152 234,142 282,120 330,106 378,92 426,68 474,56 522,36 586,22 586,204 64,204"
                    fill="#9333ea"
                    opacity="0.75"
                  />
                  <polyline
                    points="64,194 90,180 138,170 186,152 234,142 282,120 330,106 378,92 426,68 474,56 522,36 586,22"
                    fill="none"
                    stroke="#9333ea"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                  <polyline
                    points="64,198 90,192 138,182 186,176 234,162 282,152 330,142 378,126 426,112 474,102 522,88 586,72"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <polyline
                    points="64,202 90,198 138,194 186,186 234,180 282,172 330,162 378,152 426,142 474,130 522,120 586,108"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <g transform="translate(126 262)">
                    <line x1="0" y1="0" x2="28" y2="0" stroke="#155DFC" strokeWidth="4" />
                    <text x="38" y="5" fill="#155DFC" fontSize="16">
                      TC
                    </text>
                    <line x1="92" y1="0" x2="120" y2="0" stroke="#2563eb" strokeWidth="3" />
                    <text x="130" y="5" fill="#2563eb" fontSize="16">
                      Suite
                    </text>
                    <line x1="210" y1="0" x2="238" y2="0" stroke="#f59e0b" strokeWidth="3" />
                    <text x="248" y="5" fill="#f59e0b" fontSize="16">
                      Run
                    </text>
                    <line x1="304" y1="0" x2="332" y2="0" stroke="#9333ea" strokeWidth="4" />
                    <text x="342" y="5" fill="#9333ea" fontSize="16">
                      Milestone
                    </text>
                  </g>
                </svg>
              </div>
              <div className="border-border overflow-hidden rounded-xl border bg-white">
                <div className="border-border border-b px-5 py-4">
                  <h3 className="text-xl font-bold">활성 프로젝트 Top 10</h3>
                </div>
                <div className="max-h-80 overflow-auto">
                  <table className="w-full min-w-[560px] text-sm">
                    <caption className="sr-only">
                      활성 프로젝트 상위 10개의 Run 수, TC 수, AI 비용 목록
                    </caption>
                    <thead className="bg-surface-header text-text-secondary sticky top-0 text-left">
                      <tr>
                        <th scope="col" className="px-5 py-3 font-semibold">
                          프로젝트
                        </th>
                        <th scope="col" className="px-5 py-3 font-semibold">
                          Run
                        </th>
                        <th scope="col" className="px-5 py-3 font-semibold">
                          TC
                        </th>
                        <th scope="col" className="px-5 py-3 font-semibold">
                          AI 비용
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-border divide-y">
                      {activeProjects.map((project, index) => (
                        <tr key={project[0]}>
                          <td className="px-5 py-3 font-medium">
                            {index + 1}. {project[0]}
                          </td>
                          <td className="px-5 py-3">{project[1]}</td>
                          <td className="px-5 py-3">{project[2]}</td>
                          <td className="px-5 py-3">{project[3]}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <h2 id="cost-system-title" className="tracking-zero text-lg font-bold">
              비용 및 시스템 상태
            </h2>
            <section aria-labelledby="cost-system-title" className="grid gap-6 xl:grid-cols-3">
              <div className="border-border rounded-xl border bg-white p-6 xl:p-8">
                <div className="mb-7 flex items-start justify-between">
                  <h3 className="text-xl font-bold">AI 비용 (이번 달)</h3>
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
              </div>

              <div className="border-border rounded-xl border bg-white p-6 xl:p-8">
                <div className="mb-7 flex items-start justify-between">
                  <h3 className="text-xl font-bold">인프라 사용량</h3>
                  <span className="text-3xl text-[#155DFC]" aria-hidden="true">
                    ▭
                  </span>
                </div>
                <div className="space-y-6">
                  {[
                    ['Supabase DB', '8.7 GB / 10 GB', 'w-[87%]', 'bg-amber-500'],
                    ['API 호출', '487K / 500K', 'w-[97%]', 'bg-red-600'],
                    ['데이터 전송', '34 GB / 50 GB', 'w-[68%]', 'bg-[#155DFC]'],
                  ].map(([label, value, width, color]) => (
                    <div key={label}>
                      <div className="mb-2 flex justify-between text-base">
                        <span className="text-text-secondary">{label}</span>
                        <span className="font-bold">{value}</span>
                      </div>
                      <div
                        className="h-3 overflow-hidden rounded-full bg-gray-100"
                        role="progressbar"
                        aria-label={`${label} 사용량`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={label === 'Supabase DB' ? 87 : label === 'API 호출' ? 97 : 68}
                        aria-valuetext={value}
                      >
                        <div className={`h-full rounded-full ${width} ${color}`} aria-hidden="true" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-border rounded-xl border bg-white p-6 xl:p-8">
                <div className="mb-7 flex items-start justify-between">
                  <h3 className="text-xl font-bold">시스템 헬스</h3>
                  <span className="h-3 w-3 rounded-full bg-green-500" aria-hidden="true" />
                </div>
                <div className="grid gap-5">
                  {[
                    ['API 응답 시간 (평균)', '142ms'],
                    ['에러율 (24시간)', '0.03%'],
                    ['Uptime (30일)', '99.97%'],
                    ['마지막 백업', '23분 전'],
                    ['DB 커넥션 풀', '34 / 100'],
                  ].map(([label, value], index) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-text-secondary text-base">{label}</span>
                      <span className={index < 3 ? 'font-bold text-green-600' : 'font-bold'}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <h2 id="cost-spike-title" className="tracking-zero text-lg font-bold">
              비용 급증 프로젝트
            </h2>
            <section aria-labelledby="cost-spike-title">
              <div className="border-border shadow-1 rounded-lg border bg-white p-5">
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full min-w-[620px] text-sm">
                    <caption className="sr-only">
                      비용이 급증한 프로젝트의 오늘 비용, 어제 비용, 증감률, 월 누적 비용 목록
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
                          증감률
                        </th>
                        <th scope="col" className="py-2 font-semibold">
                          월 누적
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-border divide-y">
                      {costProjects.map((project) => (
                        <tr key={project[0]}>
                          {project.map((value, index) => (
                            <td
                              key={value}
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
              </div>
            </section>

            <h2 id="abuse-monitoring-title" className="tracking-zero text-lg font-bold">
              어뷰징 및 이상 행동 모니터링
            </h2>
            <section aria-labelledby="abuse-monitoring-title" className="grid gap-6 xl:grid-cols-2">
              <div className="border-border rounded-xl border bg-white p-6 xl:p-8">
                <div className="text-xl font-bold">AI 호출 비정상 사용</div>
                <div className="mt-5 grid gap-4">
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <div className="flex flex-col gap-2">
                      <div className="font-semibold">user-7f3k2@example.com</div>
                      <div className="text-text-secondary text-xs">프로젝트: AI 챗봇 테스트</div>
                      <div className="text-xl font-bold text-red-600">47,234회</div>
                      <div className="text-text-secondary text-sm">오늘</div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <div className="flex flex-col gap-2">
                      <div className="font-semibold">admin@testcompany.io</div>
                      <div className="text-text-secondary text-xs">프로젝트: E-commerce QA</div>
                      <div className="text-xl font-bold text-orange-600">28,901회</div>
                      <div className="text-text-secondary text-sm">오늘</div>
                    </div>
                  </div>
                </div>
                <div className="text-text-secondary mt-3 text-xs">
                  정상 평균: ~1,200회/일 · 기준: 10배 초과 시 알림
                </div>
              </div>

              <div className="border-border rounded-xl border bg-white p-6 xl:p-8">
                <div className="text-xl font-bold">가입 및 IP 모니터링</div>
                <div className="mt-5 grid gap-5">
                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-text-secondary text-base">신규 가입 (24시간)</div>
                        <div className="mt-2 text-4xl font-bold">
                          24{' '}
                          <span className="text-text-secondary text-base font-normal">
                            평균: 18명/일
                          </span>
                        </div>
                      </div>
                      <span className="rounded-md bg-green-100 px-3 py-1 text-sm font-bold text-green-700">
                        정상
                      </span>
                    </div>
                  </div>
                  <div className="border-border border-t pt-5">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="text-text-secondary text-base">동일 IP 다중 계정</div>
                      <span className="rounded-md bg-red-100 px-3 py-1 text-sm font-bold text-red-700">
                        1건 감지
                      </span>
                    </div>
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                      <div className="font-mono text-sm">203.0.113.45</div>
                      <div className="text-text-secondary mt-2 text-sm">
                        5개 계정 · 최근 2시간 내 생성 ·{' '}
                        <b className="text-red-600 underline">차단</b>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-border rounded-xl border bg-white p-6 xl:p-8">
                <div className="text-xl font-bold">스토리지 비정상 증가</div>
                <div className="mt-5 grid gap-4">
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <div className="font-semibold">대용량 파일 업로드 프로젝트</div>
                    <div className="text-text-secondary mt-1 text-xs">현재: 3.8 GB</div>
                    <div className="mt-2 text-right text-xl font-bold text-red-600">+2.3 GB</div>
                  </div>
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                    <div className="font-semibold">레거시 시스템 검증</div>
                    <div className="text-text-secondary mt-1 text-xs">현재: 1.2 GB</div>
                    <div className="mt-2 text-right text-xl font-bold text-orange-600">+890 MB</div>
                  </div>
                </div>
                <div className="text-text-secondary mt-3 text-xs">
                  정상 평균: ~50 MB/일 · 기준: 500 MB 초과 시 알림
                </div>
              </div>

              <div className="border-border rounded-xl border bg-white p-6 xl:p-8">
                <div className="text-xl font-bold">Rate Limit 위반</div>
                <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">테스트 자동화 스크립트</div>
                      <div className="text-text-secondary mt-1 text-sm">최근 1시간</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-orange-600">127회</div>
                      <div className="text-text-secondary text-sm">제한 초과</div>
                    </div>
                  </div>
                </div>
                <div className="text-text-secondary mt-5 text-sm">
                  API 호출 한도: 100회/분 · 현재 임시 차단: 0건
                </div>
              </div>
            </section>

            <h2 id="additional-analysis-title" className="tracking-zero text-lg font-bold">
              추가 분석
            </h2>
            <section aria-labelledby="additional-analysis-title" className="grid gap-6 xl:grid-cols-2">
              <div className="border-border shadow-1 rounded-lg border bg-white p-5">
                <h3 className="text-base font-semibold">가입 → 첫 Run 퍼널</h3>
                <div className="mt-6 grid gap-7">
                  {funnel.map((item) => (
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
                        aria-valuenow={Number.parseFloat(item[2])}
                        aria-valuetext={item[2]}
                      >
                        <div
                          className="h-full rounded-full bg-[#155DFC]"
                          style={{ width: item[2] }}
                          aria-hidden="true"
                        />
                      </div>
                      {item[3] ? (
                        <div className="mt-2 text-right text-sm text-red-600">↓ {item[3]}</div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-border shadow-1 rounded-lg border bg-white p-5">
                <h3 className="text-base font-semibold">스토리지 사용량</h3>
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
                  {storageProjects.map((project) => (
                    <div key={project[0]}>
                      <div className="mb-1 flex justify-between text-sm">
                        <span className="font-medium">{project[0]}</span>
                        <span className="text-text-secondary">{project[1]}</span>
                      </div>
                      <div
                        className="h-2 overflow-hidden rounded-full bg-gray-100"
                        role="progressbar"
                        aria-label={`${project[0]} 스토리지 사용량`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={
                          project[0] === 'E-commerce Platform'
                            ? 92
                            : project[0] === 'Mobile App Backend'
                              ? 72
                              : project[0] === 'Payment Gateway'
                                ? 58
                                : project[0] === 'User Management'
                                  ? 44
                                  : 39
                        }
                        aria-valuetext={project[1]}
                      >
                        <div
                          className={`h-full rounded-full bg-purple-600 ${project[2]}`}
                          aria-hidden="true"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
