import { z } from 'zod';

export const ChangeTypeEnum = z.enum(['create', 'edit', 'rollback']);

export const TestCaseVersionDtoSchema = z.object({
  id: z.string().uuid(),
  test_case_id: z.string().uuid(),
  version_number: z.int(),
  name: z.string(),
  test_type: z.string().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  pre_condition: z.string().nullable().optional(),
  steps: z.string().nullable().optional(),
  expected_result: z.string().nullable().optional(),
  change_summary: z.string().nullable().optional(),
  change_type: ChangeTypeEnum,
  changed_fields: z.array(z.string()).nullable().optional(),
  created_at: z.date(),
});

export type TestCaseVersionDTO = z.infer<typeof TestCaseVersionDtoSchema>;
