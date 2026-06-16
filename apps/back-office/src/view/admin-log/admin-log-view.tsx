import type { AdminActivityLog } from '@testea/db';
import { Inbox } from 'lucide-react';

const ACTION_LABEL: Record<string, { label: string; cls: string }> = {
  login: { label: '접속', cls: 'bg-blue-100 text-blue-700' },
  'notice.create': { label: '공지 생성', cls: 'bg-green-100 text-green-700' },
  'notice.update': { label: '공지 수정', cls: 'bg-gray-100 text-gray-600' },
  'notice.activate': { label: '공지 활성화', cls: 'bg-green-100 text-green-700' },
  'notice.deactivate': { label: '공지 비활성화', cls: 'bg-gray-100 text-gray-500' },
  'notice.delete': { label: '공지 삭제', cls: 'bg-red-100 text-red-700' },
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

export function AdminLogView({ logs }: { logs: AdminActivityLog[] }) {
  return (
    <div className="flex flex-col">
      <header className="border-border border-b bg-white px-8 py-6">
        <h1 className="text-text-primary text-2xl font-bold">관리자 로그</h1>
        <p className="text-text-secondary mt-1 text-sm">
          백오피스 운영자의 접속과 공지 변경 이력입니다 (최근 100건)
        </p>
      </header>

      <div className="px-8 py-6">
        <div className="border-border overflow-x-auto rounded-xl border bg-white">
          <table className="w-full min-w-[720px] text-left">
            <caption className="sr-only">관리자 활동 로그 목록</caption>
            <thead className="border-border text-text-secondary border-b bg-[#f9fafb] text-xs">
              <tr>
                <th className="px-4 py-3 font-semibold">시각</th>
                <th className="px-4 py-3 font-semibold">액션</th>
                <th className="px-4 py-3 font-semibold">대상</th>
                <th className="px-4 py-3 font-semibold">IP</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const action = ACTION_LABEL[log.action] ?? {
                  label: log.action,
                  cls: 'bg-gray-100 text-gray-600',
                };
                return (
                  <tr key={log.id} className="border-border border-b last:border-0">
                    <td className="text-text-secondary px-4 py-3 text-sm whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-md px-2.5 py-1 text-xs font-medium ${action.cls}`}>
                        {action.label}
                      </span>
                    </td>
                    <td className="text-text-primary px-4 py-3 text-sm">
                      {log.targetLabel ?? <span className="text-text-secondary">—</span>}
                    </td>
                    <td className="text-text-secondary px-4 py-3 font-mono text-xs">
                      {log.ip ?? '—'}
                    </td>
                  </tr>
                );
              })}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4}>
                    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                      <div
                        className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-400"
                        aria-hidden="true"
                      >
                        <Inbox className="h-7 w-7" />
                      </div>
                      <p className="text-text-secondary text-sm font-medium">
                        기록된 로그가 없습니다
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
