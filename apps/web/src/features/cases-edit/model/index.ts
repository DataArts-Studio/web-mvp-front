import { z } from 'zod';

type UpdateTestCaseMessages = {
  titleMin: string;
  titleMax: string;
};

/**
 * 검증 메시지를 주입받아 스키마를 생성한다.
 * 클라이언트에서 `useTranslations('cases')` 로 번역한 문자열을 넣어 i18n 한다.
 */
export const createUpdateTestCaseSchema = (messages: UpdateTestCaseMessages) =>
  z.object({
    id: z.string().uuid(),
    title: z.string().min(1, messages.titleMin).max(200, messages.titleMax),
    testSuiteId: z.string().uuid().nullable().optional(),
    testType: z.string().optional(),
    tags: z
      .union([
        z.array(z.string()),
        z.string().transform((val) =>
          val
            ? val
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean)
            : []
        ),
      ])
      .optional(),
    preCondition: z.string().optional(),
    testSteps: z.string().optional(),
    expectedResult: z.string().optional(),
  });

export const UpdateTestCaseSchema = createUpdateTestCaseSchema({
  titleMin: '테스트 케이스 이름은 최소 1글자 이상이어야 합니다.',
  titleMax: '테스트 케이스 이름은 200자를 넘을 수 없습니다.',
});

export type UpdateTestCase = z.infer<typeof UpdateTestCaseSchema>;
