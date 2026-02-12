'use server';

import { getDatabase, projects } from '@/shared/lib/db';
import { and, desc, eq, ilike } from 'drizzle-orm';
import type { ProjectSearchResult, SearchProjectsResponse } from '../model/types';

const KEYWORD_PATTERN = /^[가-힣a-zA-Z0-9\s\-_]+$/;

function validateKeyword(keyword: string): string | null {
  if (keyword.length < 2) return '최소 2자 이상 입력해주세요';
  if (keyword.length > 50) return '최대 50자까지 입력 가능합니다';
  if (!KEYWORD_PATTERN.test(keyword)) return '허용되지 않는 문자가 포함되어 있습니다';
  return null;
}

export async function searchProjects(keyword: string): Promise<SearchProjectsResponse> {
  try {
    const trimmedKeyword = keyword.trim();
    const validationError = validateKeyword(trimmedKeyword);

    if (validationError) {
      return {
        success: false,
        error: validationError,
      };
    }
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
