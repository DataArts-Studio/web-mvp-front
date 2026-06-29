'use client';

import { Bell, Github, KeyRound, Mail } from 'lucide-react';

import { DashboardShell } from './dashboard-shell';

const accountRows = [
  { label: '로그인 공급자', value: 'Supabase Auth', icon: KeyRound },
  { label: 'GitHub 연동', value: '준비 중', icon: Github },
  { label: '이메일 알림', value: '비활성', icon: Mail },
] as const;

export function SettingsDashboardView() {
  return (
    <DashboardShell
      active="settings"
      nextPath="/dashboard/settings"
      eyebrow="설정"
      title="계정 설정"
      description="로그인 계정, 알림, qaground 활동 설정을 관리합니다."
    >
      <section className="grid gap-6 lg:grid-cols-[1fr_0.85fr]">
        <div className="border-line-2 bg-bg-2 rounded-lg border p-5">
          <h2 className="text-lg font-semibold">계정 정보</h2>
          <div className="divide-line-2 mt-5 divide-y">
            {accountRows.map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="border-line-2 bg-bg-1 text-primary flex size-9 items-center justify-center rounded-md border">
                    <Icon size={17} aria-hidden="true" />
                  </div>
                  <span className="text-sm font-medium">{label}</span>
                </div>
                <span className="text-text-3 shrink-0 text-sm">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-line-2 bg-bg-2 rounded-lg border p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">알림 설정</h2>
            <Bell className="text-primary" size={20} aria-hidden="true" />
          </div>
          <div className="grid gap-3">
            {[
              ['풀이 리마인더', '매주 풀 문제를 추천합니다.'],
              ['제출 결과 요약', '채점 결과가 저장되면 요약을 보여줍니다.'],
              ['글 댓글 알림', '작성한 글에 반응이 생기면 알려줍니다.'],
            ].map(([title, desc]) => (
              <label
                key={title}
                className="border-line-2 bg-bg-1 flex items-start gap-3 rounded-lg border p-4"
              >
                <input
                  type="checkbox"
                  className="mt-1 size-4 accent-[var(--color-primary)]"
                  disabled
                />
                <span>
                  <span className="block text-sm font-medium">{title}</span>
                  <span className="text-text-3 mt-1 block text-xs">{desc}</span>
                </span>
              </label>
            ))}
          </div>
          <p className="text-text-3 mt-4 text-xs">
            저장 API가 추가되기 전까지 설정 변경은 비활성 상태입니다.
          </p>
        </div>
      </section>
    </DashboardShell>
  );
}
