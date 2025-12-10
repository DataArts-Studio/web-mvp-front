'use server';
import { CreateProjectSchema } from '@/entities/project/model';
import { getDatabase, project } from '@/shared/lib/db';
import { z } from 'zod';

type MockProjectData = {
  name: string;
  password: string;
  description?: string;
  owner_name?: string;
};

type MockFlatErrors = {
  formErrors: string[];
  fieldErrors: { [key in keyof MockProjectData]?: string[] };
};

// TODO: 빠른 개발용 any 적용
const createProject = async (data: any) => {
  const db = getDatabase();
  return await db.insert(project).values(data).returning();
};

// TODO: 빠른 개발용 any 적용
export const createProjectAction = async (formData: any) => {
  const data = Object.fromEntries(formData.entries());
  const validation = CreateProjectSchema.safeParse(data);
  if (!validation.success) return { success: false, errors: z.flattenError(validation.error) };

  const newProject = await createProject(validation.data);
  return { success: true, project: newProject };
};

export const createProjectMock = async (formData: FormData) => {
  const data = Object.fromEntries(formData.entries());
  const name = typeof data.name === 'string' ? data.name : '';
  const password = typeof data.password === 'string' ? data.password : '';

  await new Promise((resolve) => setTimeout(resolve, 500));
  if (name.length === 0 || password.length === 0) {
    const mockErrors: MockFlatErrors = {
      formErrors: ['필수 입력 항목이 누락되었습니다.'],
      fieldErrors: {
        name: name.length === 0 ? ['프로젝트 이름을 입력해야 합니다.'] : undefined,
        password: password.length === 0 ? ['비밀번호를 입력해야 합니다.'] : undefined,
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
    errors: {id: `uuid-${Date.now()}`, ...data },
  };
};
