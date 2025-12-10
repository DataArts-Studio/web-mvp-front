import { z } from 'zod';
import { ProjectSchema, CreateProjectSchema } from './schema';

export type CreateProjectDTO = z.infer<typeof CreateProjectSchema>;
export type ProjectDTO = z.infer<typeof ProjectSchema>;
export type Project = Omit<ProjectDTO, 'password'>;