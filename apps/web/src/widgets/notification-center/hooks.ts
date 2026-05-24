'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AnnouncementWithReadState } from '@testea/db';

const UNREAD_KEY = ['announcements', 'unread-count'] as const;
const LIST_KEY = ['announcements', 'me'] as const;

interface UnreadCountResponse {
  count: number;
}

interface AnnouncementListResponse {
  items: AnnouncementWithReadState[];
}

async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, {
    credentials: 'same-origin',
    ...init,
  });
  if (!res.ok) throw new Error(`request failed: ${input} ${res.status}`);
  return res.json();
}

export function useUnreadCount() {
  return useQuery({
    queryKey: UNREAD_KEY,
    queryFn: () => fetchJson<UnreadCountResponse>('/api/announcements/unread-count'),
    refetchInterval: 60_000,
    staleTime: 30_000,
    placeholderData: { count: 0 },
  });
}

export function useAnnouncementList(enabled: boolean) {
  return useQuery({
    queryKey: LIST_KEY,
    queryFn: () => fetchJson<AnnouncementListResponse>('/api/announcements/me'),
    enabled,
    staleTime: 30_000,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (announcementId: string) => {
      const res = await fetch(`/api/announcements/${announcementId}/read`, {
        method: 'POST',
        credentials: 'same-origin',
      });
      if (!res.ok && res.status !== 204) {
        // 읽음 처리 실패는 silent fail (FDD-NT01)
        return;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: UNREAD_KEY });
      qc.invalidateQueries({ queryKey: LIST_KEY });
    },
  });
}
