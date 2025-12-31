'use server';

import { CreateTestCaseDtoSchema } from '@/entities/test-case';
import { getDatabase, testCases } from "@/shared/lib/db";
import { z } from 'zod';

type MockTestCaseData = {
  name: string;
  project_id: string;
  test_suite_id: string;
};

type MockFlatErrors = {
  formErrors: string[];
  fieldErrors: { [key in keyof MockTestCaseData]?: string[] };
};

const createTestCase = async (data: any) => {
  const db = getDatabase();
  return await db.insert(testCases).values(data).returning();
}

export const createTestCaseAction = async (formData: any) => {
  const data = Object.fromEntries(formData.entries());
  const validation = CreateTestCaseDtoSchema.safeParse(data);
  if (!validation.success) return { success: false, errors: z.flattenError(validation.error) };

  const newTestCase = await createTestCase(validation.data);
  return { success: true, testCase: newTestCase };
};

export const createTestCaseMock = async (formData: FormData) => {
  const data = Object.fromEntries(formData.entries());
  const name = typeof data.name === 'string' ? data.name : '';
  const project_id = typeof data.project_id === 'string' ? data.project_id : '';
  const test_suite_id = typeof data.test_suite_id === 'string' ? data.test_suite_id : '';

  await new Promise((resolve) => setTimeout(resolve, 500));

  if (!name || !project_id || !test_suite_id) {
    const mockErrors: MockFlatErrors = {
      formErrors: ['필수 입력 항목이 누락되었습니다.'],
      fieldErrors: {
        name: !name ? ['테스트 케이스 이름을 입력해야 합니다.'] : undefined,
        project_id: !project_id ? ['프로젝트 ID가 필요합니다.'] : undefined,
        test_suite_id: !test_suite_id ? ['테스트 스위트 ID가 필요합니다.'] : undefined,
      },
    };
    return { success: false, errors: mockErrors };
  }

  if (name.toUpperCase() === 'SERVER_ERROR') {
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