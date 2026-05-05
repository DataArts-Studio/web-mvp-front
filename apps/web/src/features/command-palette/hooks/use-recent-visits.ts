import { useCallback, useSyncExternalStore } from 'react';
import type { RecentVisit } from '../model/types';

const MAX_RECENT = 10;

const getStorageKey = (projectId: string) => `testea:recent-visits:${projectId}`;

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

const getVisits = (projectId: string): RecentVisit[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(getStorageKey(projectId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const addRecentVisit = (projectId: string, visit: Omit<RecentVisit, 'visitedAt'>) => {
  const visits = getVisits(projectId);
  const filtered = visits.filter((v) => !(v.type === visit.type && v.id === visit.id));
  const updated = [{ ...visit, visitedAt: Date.now() }, ...filtered].slice(0, MAX_RECENT);
  localStorage.setItem(getStorageKey(projectId), JSON.stringify(updated));
  notify();
};

export const removeRecentVisit = (projectId: string, type: string, id: string) => {
  const visits = getVisits(projectId);
  const updated = visits.filter((v) => !(v.type === type && v.id === id));
  localStorage.setItem(getStorageKey(projectId), JSON.stringify(updated));
  notify();
};

export const useRecentVisits = (projectId: string): RecentVisit[] => {
  const subscribe = useCallback(
    (callback: () => void) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    [],
  );

  const getSnapshot = useCallback(() => {
    return localStorage.getItem(getStorageKey(projectId)) ?? '[]';
  }, [projectId]);

  const getServerSnapshot = useCallback(() => '[]', []);

  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};
