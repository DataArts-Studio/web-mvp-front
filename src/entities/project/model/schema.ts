import { z } from 'zod';

export const ProjectSchema = z.object({
  id: z.uuidv7(),
  name: z.string(),
  password: z.string(),
  description: z.string(),
  owner_name: z.string(),
  create_at: z.date(),
  update_at: z.date(),
  delete_at: z.date(),
});