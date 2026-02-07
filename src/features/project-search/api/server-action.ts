'use server';

import { getDatabase, projects } from '@/shared/lib/db';
import { and, desc, eq, ilike } from 'drizzle-orm';
import { SearchKeywordSchema } from '../model/schema';
import type { ProjectSearchResult, SearchProjectsResponse } from '../model/types';

export async function searchProjects(keyword: string): Promise<SearchProjectsResponse> {
  try {
    const validation = SearchKeywordSchema.safeParse({ keyword: keyword.trim() });

    if (!validation.success) {
      const errorMessage = validation.error.issues[0]?.message ?? '입력값이 올바르지 않습니다';
      return {
        success: false,
        error: errorMessage,
      };
    }

    const trimmedKeyword = keyword.trim();
    const db = getDatabase();

    const rows = await db
      .select({
        id: projects.id,
        name: projects.name,
        created_at: projects.created_at,
        owner_name: projects.owner_name,
      })
      .from(projects)
      .where(
        and(
          ilike(projects.name, `%${trimmedKeyword}%`),
          eq(projects.lifecycle_status, 'ACTIVE')
        )
      )
      .orderBy(desc(projects.created_at))
      .limit(10);

    const results: ProjectSearchResult[] = rows.map((row) => ({
      id: row.id,
      projectName: row.name,
      slug: row.name,
      createdAt: row.created_at,
      ownerName: row.owner_name ?? undefined,
    }));

    return {
      success: true,
      data: results,
      message: results.length > 0 ? `${results.length}건의 프로젝트를 찾았습니다` : undefined,
    };
  } catch (error) {
    console.error('Error searching projects:', error);
    return {
      success: false,
      error: '검색 중 오류가 발생했습니다. 다시 시도해주세요',
    };
  }
}
