'use server';
import { CreateTestRunSchema } from '@/entities/test-run';
import { getDatabase, testRun } from '@/shared/lib/db';
import { z } from 'zod';

type MockTestRunData = {
  project_id: string;
  milestone_id?: string;
  run_name?: string;
  started_at?: string;
  ended_at?: string;
};

type MockFlatErrors = {
  formErrors: string[];
  fieldErrors: { [key in keyof MockTestRunData]?: string[] };
};

const createTestRun = async (data: any) => {
  const db = getDatabase();
  return await db.insert(testRun).values(data).returning();
};

export const createTestRunAction = async (formData: any) => {
  const data = Object.fromEntries(formData.entries());
  const validation = CreateTestRunSchema.safeParse(data);
  if (!validation.success) return { success: false, errors: z.flattenError(validation.error) };

  const newTestRun = await createTestRun(validation.data);
  return { success: true, testRun: newTestRun };
};

export const createTestRunMock = async (formData: FormData) => {
  const data = Object.fromEntries(formData.entries());
  const project_id = typeof data.project_id === 'string' ? data.project_id : '';
  const run_name = typeof data.run_name === 'string' ? data.run_name : '';

  await new Promise((resolve) => setTimeout(resolve, 500));

  if (!project_id) {
    const mockErrors: MockFlatErrors = {
      formErrors: ['필수 입력 항목이 누락되었습니다.'],
      fieldErrors: {
        project_id: ['프로젝트 ID가 필요합니다.'],
      },
    };
    return { success: false, errors: mockErrors };
  }

  if (run_name.toUpperCase() === 'SERVER_ERROR') {
    const mockServerError: MockFlatErrors = {
      formErrors: ['DB 연결 실패: 서버 내부에서 치명적인 오류가 발생했습니다.'],
      fieldErrors: {},
    };
    return { success: false, errors: mockServerError };
  }

  return {
    success: true,
    errors: { id: `uuid-${Date.now()}`, ...data },
  };
};