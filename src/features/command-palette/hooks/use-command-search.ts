import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { FileText, FolderOpen, Flag, Play } from 'lucide-react';
import type { CommandItem } from '../model/types';
import type { ActionResult } from '@/shared/types';

type CacheTestCase = {
  id: string;
  caseKey: string;
  title: string;
};

type CacheTestSuite = {
  id: string;
  title: string;
};

type CacheMilestone = {
  id: string;
  title: string;
};

type CacheTestRun = {
  id: string;
  name: string;
};

const MAX_PER_CATEGORY = 5;

const matchScore = (text: string, query: string): number => {
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  if (lower === q) return 3;
  if (lower.startsWith(q)) return 2;
  if (lower.includes(q)) return 1;
  return 0;
};

export const useCommandSearch = (
  query: string,
  projectSlug: string,
  projectId: string | undefined,
): CommandItem[] => {
  const queryClient = useQueryClient();

  return useMemo(() => {
    if (!query.trim() || !projectId) return [];

    const q = query.trim();
    const results: CommandItem[] = [];
    const basePath = `/projects/${projectSlug}`;

    // 1. Test Cases
    const tcData = queryClient.getQueriesData<ActionResult<CacheTestCase[]>>({
      queryKey: ['testCases', 'list', projectId],
    });
    const testCases = tcData.flatMap(([, data]) =>
      data?.success && data.data ? data.data : [],
    );
    const matchedTCs = testCases
      .map((tc) => ({
        tc,
        score: Math.max(matchScore(tc.title, q), matchScore(tc.caseKey, q) + (tc.caseKey.toLowerCase() === q.toLowerCase() ? 5 : 0)),
      }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_PER_CATEGORY);

    for (const { tc } of matchedTCs) {
      results.push({
        id: `tc:${tc.id}`,
        category: 'testCase',
        icon: FileText,
        title: `${tc.caseKey} ${tc.title}`,
        subtitle: '테스트 케이스',
        href: `${basePath}/cases/${tc.id}`,
      });
    }

    // 2. Test Suites
    const suiteData = queryClient.getQueriesData<ActionResult<CacheTestSuite[]>>({
      queryKey: ['testSuites', projectId],
    });
    const suites = suiteData.flatMap(([, data]) =>
      data?.success && data.data ? data.data : [],
    );
    const matchedSuites = suites
      .map((s) => ({ s, score: matchScore(s.title, q) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_PER_CATEGORY);

    for (const { s } of matchedSuites) {
      results.push({
        id: `suite:${s.id}`,
        category: 'testSuite',
        icon: FolderOpen,
        title: s.title,
        subtitle: '테스트 스위트',
        href: `${basePath}/suites/${s.id}`,
      });
    }

    // 3. Milestones
    const msData = queryClient.getQueriesData<ActionResult<CacheMilestone[]>>({
      queryKey: ['milestones', projectId],
    });
    const milestones = msData.flatMap(([, data]) =>
      data?.success && data.data ? data.data : [],
    );
    const matchedMs = milestones
      .map((m) => ({ m, score: matchScore(m.title, q) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_PER_CATEGORY);

    for (const { m } of matchedMs) {
      results.push({
        id: `ms:${m.id}`,
        category: 'milestone',
        icon: Flag,
        title: m.title,
        subtitle: '마일스톤',
        href: `${basePath}/milestones/${m.id}`,
      });
    }

    // 4. Test Runs
    const runData = queryClient.getQueriesData<ActionResult<CacheTestRun[]>>({
      queryKey: ['testRuns', projectId],
    });
    const runs = runData.flatMap(([, data]) =>
      data?.success && data.data ? data.data : [],
    );
    const matchedRuns = runs
      .map((r) => ({ r, score: matchScore(r.name, q) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, MAX_PER_CATEGORY);

    for (const { r } of matchedRuns) {
      results.push({
        id: `run:${r.id}`,
        category: 'testRun',
        icon: Play,
        title: r.name,
        subtitle: '테스트 실행',
        href: `${basePath}/runs/${r.id}`,
      });
    }

    return results;
  }, [query, projectId, projectSlug, queryClient]);
};
