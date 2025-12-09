import { z } from 'zod';
import { ProjectSchema } from './schema';

export type ProjectDTO = z.infer<typeof ProjectSchema>;
export type Project = Omit<ProjectDTO, 'password'>;