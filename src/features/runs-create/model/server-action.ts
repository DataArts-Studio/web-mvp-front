'use server';
import { CreateTestRunInputSchema } from '@/entities/test-run';
import { getDatabase, testRun } from '@/shared/lib/db';
import { v7 as uuidv7 } from 'uuid';

type FlatErrors = {
  formErrors: string[];
  fieldErrors: Record<string, string[] | undefined>;
};

const createTestRun = async (data: {
  id: string;
  project_id: string;
  run_name: string;
  source_type: 'SUITE' | 'MILESTONE' | 'ADHOC';
  milestone_id?: string | null;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
}) => {
  const db = getDatabase();
  return await db.insert(testRun).values(data).returning();
};

export const createTestRunAction = async (formData: FormData) => {
  const rawData = Object.fromEntries(formData.entries());
  console.log('[createTestRunAction] rawData:', rawData);

  const validation = CreateTestRunInputSchema.safeParse(rawData);
  if (!validation.success) {
    console.error('[createTestRunAction] Validation failed:', validation.error.flatten());
    return { success: false, errors: validation.error.flatten() as FlatErrors };
  }

  console.log('[createTestRunAction] Validation passed:', validation.data);

  try {
    const insertData = {
      id: uuidv7(),
      project_id: validation.data.project_id,
      run_name: validation.data.run_name,
      source_type: validation.data.source_type,
      milestone_id: validation.data.milestone_id || null,
      status: 'NOT_STARTED' as const,
    };
    console.log('[createTestRunAction] Inserting:', insertData);

    const newTestRun = await createTestRun(insertData);
    console.log('[createTestRunAction] Created:', newTestRun);

    return { success: true, testRun: newTestRun };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[createTestRunAction] DB Error:', errorMessage, error);
    return {
      success: false,
      errors: {
        formErrors: [`테스트 실행 생성에 실패했습니다: ${errorMessage}`],
        fieldErrors: {},
      } as FlatErrors,
    };
  }
};

export const createTestRunMock = async (formData: FormData) => {
  const data = Object.fromEntries(formData.entries());
  const project_id = typeof data.project_id === 'string' ? data.project_id : '';
  const run_name = typeof data.run_name === 'string' ? data.run_name : '';

  await new Promise((resolve) => setTimeout(resolve, 500));

  if (!project_id) {
    const mockErrors: FlatErrors = {
      formErrors: ['필수 입력 항목이 누락되었습니다.'],
      fieldErrors: {
        project_id: ['프로젝트 ID가 필요합니다.'],
      },
    };
    return { success: false, errors: mockErrors };
  }

  if (run_name.toUpperCase() === 'SERVER_ERROR') {
    const mockServerError: FlatErrors = {
      formErrors: ['DB 연결 실패: 서버 내부에서 치명적인 오류가 발생했습니다.'],
      fieldErrors: {},
    };
    return { success: false, errors: mockServerError };
  }

  return {
    success: true,
    data: { id: `uuid-${Date.now()}`, ...data },
  };
};