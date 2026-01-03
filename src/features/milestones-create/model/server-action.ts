'use server';
import { CreateMilestoneSchema } from '@/entities/milestone';
import { getDatabase, milestones } from '@/shared/lib/db';
import { z } from 'zod';

type MockMilestoneData = {
  name: string;
  project_id: string;
  start_date: string;
  end_date: string;
  status?: string;
  description?: string;
};

type MockFlatErrors = {
  formErrors: string[];
  fieldErrors: { [key in keyof MockMilestoneData]?: string[] };
};

const createMilestone = async (data: any) => {
  const db = getDatabase();
  return await db.insert(milestones).values(data).returning();
};

export const createMilestoneAction = async (formData: any) => {
  const data = Object.fromEntries(formData.entries());
  const validation = CreateMilestoneSchema.safeParse(data);
  if (!validation.success) return { success: false, errors: z.flattenError(validation.error) };

  const newMilestone = await createMilestone(validation.data);
  return { success: true, milestone: newMilestone };
};

export const createMilestoneMock = async (formData: FormData) => {
  const data = Object.fromEntries(formData.entries());
  const name = typeof data.name === 'string' ? data.name : '';
  const project_id = typeof data.project_id === 'string' ? data.project_id : '';
  const start_date = typeof data.start_date === 'string' ? data.start_date : '';
  const end_date = typeof data.end_date === 'string' ? data.end_date : '';

  await new Promise((resolve) => setTimeout(resolve, 500));

  if (!name || !project_id || !start_date || !end_date) {
    const mockErrors: MockFlatErrors = {
      formErrors: ['필수 입력 항목이 누락되었습니다.'],
      fieldErrors: {
        name: !name ? ['마일스톤 이름을 입력해야 합니다.'] : undefined,
        project_id: !project_id ? ['프로젝트 ID가 필요합니다.'] : undefined,
        start_date: !start_date ? ['시작일을 입력해야 합니다.'] : undefined,
        end_date: !end_date ? ['종료일을 입력해야 합니다.'] : undefined,
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