import { z } from 'zod';
import { getDatabase, project } from '@/shared/lib/db';
import { CreateProjectSchema, type CreateProjectDTO } from '@/entities/project/model';

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
}