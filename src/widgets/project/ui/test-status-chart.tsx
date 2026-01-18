'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

// 테스트 상태별 색상 정의
const STATUS_COLORS = {
  pass: '#0BB57F',      // primary green
  fail: '#FC4141',      // system red
  blocked: '#F5A623',   // orange/yellow
  untested: '#5C6370',  // gray
} as const;

// 상태 라벨 정의
const STATUS_LABELS = {
  pass: 'Passed',
  fail: 'Failed',
  blocked: 'Blocked',
  untested: 'Not Run',
} as const;

export type TestStatusData = {
  pass: number;
  fail: number;
  blocked: number;
  untested: number;
};

type TestStatusChartProps = {
  data: TestStatusData;
  criticalFailCount?: number;
};

// 노티스 메시지 결정 함수
const getNoticeMessage = (
  data: TestStatusData,
  criticalFailCount?: number
): { type: 'critical' | 'success' | 'warning' | 'info'; message: string } | null => {
  const total = data.pass + data.fail + data.blocked + data.untested;

  if (total === 0) {
    return { type: 'info', message: '테스트 케이스를 생성해보세요' };
  }

  // Critical/High Fail이 있는 경우
  if (criticalFailCount && criticalFailCount > 0) {
    return { type: 'critical', message: `Critical Fail ${criticalFailCount}개 확인 필요` };
  }

  // 100% Pass
  if (data.fail === 0 && data.blocked === 0 && data.untested === 0 && data.pass > 0) {
    return { type: 'success', message: '모든 테스트 통과!' };
  }

  // Untested > 50%
  const untestedRate = (data.untested / total) * 100;
  if (untestedRate > 50) {
    return { type: 'warning', message: `미실행 케이스 ${data.untested}개` };
  }

  return null;
};

// 커스텀 툴팁
const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number; payload: { percentage: number } }> }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-bg-3 border border-line-2 rounded-2 px-3 py-2 shadow-lg">
        <p className="typo-body2-heading text-text-1">{data.name}</p>
        <p className="typo-caption text-text-2">
          {data.value}개 ({data.payload.percentage.toFixed(1)}%)
        </p>
      </div>
    );
  }
  return null;
};

export const TestStatusChart = ({ data, criticalFailCount }: TestStatusChartProps) => {
  const total = data.pass + data.fail + data.blocked + data.untested;
  const completed = data.pass + data.fail + data.blocked;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const passRate = completed > 0 ? Math.round((data.pass / completed) * 100) : 0;

  // 차트 데이터 변환
  const chartData = [
    { name: STATUS_LABELS.pass, value: data.pass, key: 'pass', percentage: total > 0 ? (data.pass / total) * 100 : 0 },
    { name: STATUS_LABELS.fail, value: data.fail, key: 'fail', percentage: total > 0 ? (data.fail / total) * 100 : 0 },
    { name: STATUS_LABELS.blocked, value: data.blocked, key: 'blocked', percentage: total > 0 ? (data.blocked / total) * 100 : 0 },
    { name: STATUS_LABELS.untested, value: data.untested, key: 'untested', percentage: total > 0 ? (data.untested / total) * 100 : 0 },
  ].filter(item => item.value > 0);

  const notice = getNoticeMessage(data, criticalFailCount);

  // 빈 상태 처리
  if (total === 0) {
    return (
      <div className="rounded-3 border-line-2 bg-bg-2 border p-6">
        <div className="flex flex-col items-center justify-center gap-4 py-8">
          <div className="relative h-[180px] w-[180px]">
            <div className="absolute inset-0 rounded-full border-8 border-bg-4" />
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="typo-h1-heading text-text-3">0%</span>
              <span className="typo-caption text-text-3">Complete</span>
            </div>
          </div>
          {notice && (
            <div className="flex items-center gap-2 text-text-3">
              <Info className="h-4 w-4" />
              <span className="typo-body2-normal">{notice.message}</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3 border-line-2 bg-bg-2 border p-6">
      <div className="flex items-center gap-8">
        {/* 도넛 차트 */}
        <div className="relative h-[200px] w-[200px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.key}
                    fill={STATUS_COLORS[entry.key as keyof typeof STATUS_COLORS]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* 중앙 라벨 */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="typo-h1-heading text-primary">{completionRate}%</span>
            <span className="typo-caption text-text-3">Complete</span>
          </div>
        </div>

        {/* 범례 */}
        <div className="flex flex-1 flex-col gap-3">
          {[
            { key: 'pass', label: STATUS_LABELS.pass, value: data.pass },
            { key: 'fail', label: STATUS_LABELS.fail, value: data.fail },
            { key: 'blocked', label: STATUS_LABELS.blocked, value: data.blocked },
            { key: 'untested', label: STATUS_LABELS.untested, value: data.untested },
          ].map((item) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0;
            return (
              <div key={item.key} className="flex items-center gap-3">
                {/* 색상 인디케이터 */}
                <div
                  className="h-3 w-3 rounded-sm shrink-0"
                  style={{ backgroundColor: STATUS_COLORS[item.key as keyof typeof STATUS_COLORS] }}
                />
                {/* 라벨 */}
                <span className="typo-body2-normal text-text-2 w-20">{item.label}</span>
                {/* 프로그레스 바 */}
                <div className="flex-1 h-2 bg-bg-4 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: STATUS_COLORS[item.key as keyof typeof STATUS_COLORS],
                    }}
                  />
                </div>
                {/* 수치 */}
                <span className="typo-body2-heading text-text-1 w-12 text-right">
                  {item.value}개
                </span>
                <span className="typo-caption text-text-3 w-14 text-right">
                  ({percentage.toFixed(0)}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 노티스 영역 */}
      {notice && (
        <div
          className={`mt-4 flex items-center gap-2 rounded-2 px-4 py-3 ${
            notice.type === 'critical'
              ? 'bg-system-red/10 text-system-red'
              : notice.type === 'success'
              ? 'bg-primary/10 text-primary'
              : notice.type === 'warning'
              ? 'bg-[#F5A623]/10 text-[#F5A623]'
              : 'bg-bg-3 text-text-3'
          }`}
        >
          {notice.type === 'critical' && <AlertTriangle className="h-4 w-4" />}
          {notice.type === 'success' && <CheckCircle className="h-4 w-4" />}
          {notice.type === 'warning' && <AlertTriangle className="h-4 w-4" />}
          {notice.type === 'info' && <Info className="h-4 w-4" />}
          <span className="typo-body2-normal">{notice.message}</span>
        </div>
      )}
    </div>
  );
};
