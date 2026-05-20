import { z } from 'zod';

export const SearchKeywordSchema = z.object({
  keyword: z
    .string()
    .min(2, '최소 2자 이상 입력해주세요')
    .max(50, '최대 50자까지 입력 가능합니다')
    .regex(/^[가-힣a-zA-Z0-9\s\-_]+$/, '허용되지 않는 문자가 포함되어 있습니다'),
});

export const ProjectSearchResultSchema = z.object({
  id: z.string(),
  projectName: z.string(),
  slug: z.string(),
  createdAt: z.date(),
  ownerName: z.string().optional(),
});
