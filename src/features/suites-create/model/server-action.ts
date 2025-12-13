'use server';

import {getDatabase, suite} from "@/shared/lib/db";
import {CreateTestSuiteSchema} from "@/entities/test-suite/model/schema";

type MockTestSuiteData = {
  name: string;
  password: string;
  description?: string;
  owner_name?: string;
};

type MockFlatErrors = {
  formErrors: string[];
  fieldErrors: { [key in keyof MockTestSuiteData]?: string[] };
};

const createTestSuite = async (data: any) => {
  const db = getDatabase();
  return await db.insert(suite).values(data).returning();
}

export const createSuiteAction = async (formData: any) => {
  const data = Object.fromEntries(formData.entries());
  const validation = CreateTestSuiteSchema.safeParse(data);
  if (!validation.success) return { success: false, errors: validation.error };
  const newSuite = await createTestSuite(validation.data);
  return { success: true, suite: newSuite };
}

export const createSuiteMock = async (formData: any) => {
  const data = Object.fromEntries(formData.entries());
  const name = typeof data.name === 'string' ? data.name : '';

  await new Promise((resolve) => setTimeout(resolve, 500));
  if (name.length === 0) {
    const mockErrors: any = {
      formErrors: ['필수 입력 항목이 누락되었습니다.'],
      fieldErrors: {
        name: name.length === 0 ? ['테스트 스위트 이름을 입력해야 합니다.'] : undefined,
      }
    }
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
    errors: {id: `uuid-${Date.now()}`, ...data },
  };
}