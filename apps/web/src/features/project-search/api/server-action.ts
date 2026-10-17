'use server';

import { escapeLikePattern, toContainsPattern } from '@/shared/lib/like-pattern';
import { RATE_LIMITED_MESSAGE, isPublicActionLimited } from '@/shared/lib/rate-limit';
import * as Sentry from '@sentry/nextjs';
import { getDatabase, projects } from '@testea/db';
import { and, desc, eq, ilike } from 'drizzle-orm';

import type { ProjectSearchResult, SearchProjectsResponse } from '../model/types';

// 프로젝트 이름은 어떤 문자든 쓸 수 있으므로, 검색도 제어 문자만 막고 나머지는 글자 그대로 찾는다 (#405).
const hasControlChar = (value: string) =>
  Array.from(value).some((char) => {
    const code = char.charCodeAt(0);
    return code < 0x20 || code === 0x7f;
  });

/** 이 길이 미만이면 부분 일치 대신 이름 전체가 같은 프로젝트만 찾는다(한 글자 이름도 찾을 수 있게). */
const PARTIAL_MATCH_MIN_LENGTH = 2;

function validateKeyword(keyword: string): string | null {
  if (keyword.length === 0) return '검색어를 입력해주세요';
  if (keyword.length > 50) return '최대 50자까지 입력 가능합니다';
  if (hasControlChar(keyword)) return '허용되지 않는 문자가 포함되어 있습니다';
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
    // 자동완성이 디바운스 뒤 호출하므로 사람이 치는 속도로는 닿지 않는 값이다.
    if (await isPublicActionLimited('search-projects', { limit: 60, windowMs: 60_000 })) {
      return { success: false, error: RATE_LIMITED_MESSAGE };
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
          ilike(
            projects.name,
            trimmedKeyword.length < PARTIAL_MATCH_MIN_LENGTH
              ? escapeLikePattern(trimmedKeyword)
              : toContainsPattern(trimmedKeyword)
          ),
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
    Sentry.captureException(error, { extra: { action: 'searchProjects' } });
    return {
      success: false,
      error: '검색 중 오류가 발생했습니다. 다시 시도해주세요',
    };
  }
}
