import { z } from 'zod';

import {
  ChangeIdentifierFormSchema,
  CreateProjectDomainSchema,
  CreateProjectDtoSchema,
  ProjectDomainSchema,
  ProjectDtoSchema,
  ProjectFormSchema,
  ProjectSettingsFormSchema,
} from './schema';

export type CreateProjectDomain = z.infer<typeof CreateProjectDomainSchema>;
export type CreateProjectDTO = z.infer<typeof CreateProjectDtoSchema>;
export type ProjectDomain = z.infer<typeof ProjectDomainSchema>;
export type ProjectDTO = z.infer<typeof ProjectDtoSchema>;
export type ProjectForm = z.infer<typeof ProjectFormSchema>;
export type ProjectView = Omit<ProjectForm, 'identifierConfirm'>;
export type ProjectSettingsForm = z.infer<typeof ProjectSettingsFormSchema>;
export type ChangeIdentifierForm = z.infer<typeof ChangeIdentifierFormSchema>;
