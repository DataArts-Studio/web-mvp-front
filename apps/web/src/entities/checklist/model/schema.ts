import { z } from 'zod';

export const CreateChecklistSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().min(1, '제목을 입력해주세요').max(200, '제목은 200자를 넘을 수 없습니다'),
  items: z.array(
    z.object({ content: z.string().min(1, '항목 내용을 입력해주세요').max(500) }),
  ).min(1, '최소 1개 항목이 필요합니다').max(50, '항목은 최대 50개까지 추가할 수 있습니다'),
});

export const UpdateChecklistItemSchema = z.object({
  itemId: z.string().uuid(),
  isChecked: z.boolean(),
});

export const AddChecklistItemSchema = z.object({
  checklistId: z.string().uuid(),
  content: z.string().min(1, '항목 내용을 입력해주세요').max(500),
});

export const ConvertToTestCasesSchema = z.object({
  checklistId: z.string().uuid(),
  suiteId: z.string().uuid().optional(),
  itemIds: z.array(z.string().uuid()).min(1, '최소 1개 항목을 선택해주세요'),
});
