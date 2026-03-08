import React from 'react';

import { Clock } from 'lucide-react';

import { formatRelativeTime } from '@/shared/utils/date-format';

type ActivityItem = {
  id: string;
  title: string;
  created_at: string;
};

type DashboardRecentActivityProps = {
  recentActivities: ActivityItem[];
};

export const DashboardRecentActivity = ({ recentActivities }: DashboardRecentActivityProps) => (
  <div className="rounded-3 border-line-2 bg-bg-2 col-span-4 flex flex-col gap-4 border p-5" data-tour="recent-activity">
    <span className="typo-body2-heading text-text-3">최근 활동</span>
    {recentActivities.length === 0 ? (
      <div className="flex flex-col items-center justify-center gap-2 py-6 flex-1">
        <Clock className="text-text-3 h-8 w-8" />
        <p className="typo-body2-normal text-text-3">최근 활동이 없습니다.</p>
      </div>
    ) : (
      <ul className="flex flex-col gap-2">
        {recentActivities.slice(0, 7).map((item) => (
          <li key={item.id} className="flex items-center gap-2">
            <span className="bg-primary h-1.5 w-1.5 rounded-full" />
            <span className="typo-body2-normal text-text-1 flex-1 truncate">{item.title}</span>
            <span className="typo-caption text-text-3">{formatRelativeTime(item.created_at)}</span>
          </li>
        ))}
      </ul>
    )}
  </div>
);
