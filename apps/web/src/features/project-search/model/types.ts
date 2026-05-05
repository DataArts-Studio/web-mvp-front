import type { z } from 'zod';
import type { SearchKeywordSchema, ProjectSearchResultSchema } from './schema';

export type SearchKeyword = z.infer<typeof SearchKeywordSchema>;

export type ProjectSearchResult = z.infer<typeof ProjectSearchResultSchema>;

export type SearchProjectsResponse =
  | { success: true; data: ProjectSearchResult[]; message?: string }
  | { success: false; error: string };

export type SearchModalStatus = 'idle' | 'searching' | 'success' | 'empty' | 'error';

export type SearchModalState = {
  isOpen: boolean;
  status: SearchModalStatus;
  keyword: string;
  results: ProjectSearchResult[];
  selectedProject: ProjectSearchResult | null;
  error: string | null;
};
