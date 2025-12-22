import { z } from 'zod';

import {
  ProjectFormSchema,
  CreateProjectDomainSchema,
  CreateProjectDtoSchema,
  ProjectDomainSchema,
  ProjectDtoSchema,
} from './schema';

export type CreateProjectDomain = z.infer<typeof CreateProjectDomainSchema>;
export type CreateProjectDTO = z.infer<typeof CreateProjectDtoSchema>;
export type ProjectDomain = z.infer<typeof ProjectDomainSchema>;
export type ProjectDTO = z.infer<typeof ProjectDtoSchema>;
export type ProjectForm = z.infer<typeof ProjectFormSchema>;
export type ProjectView = Omit<ProjectDTO, 'password'>;