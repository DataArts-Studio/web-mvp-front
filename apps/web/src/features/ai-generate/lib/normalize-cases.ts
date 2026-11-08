import { extractJson, salvageArrayObjects } from '@/entities/ai-config/lib/llm-json';
import { GeneratedTestCaseSchema } from '@/entities/ai-config/model/schema';
import type { z } from 'zod';

type GeneratedTestCase = z.output<typeof GeneratedTestCaseSchema>;

/** 스키마 상한과 맞춘 필드 길이. 넘치면 버리지 않고 자른다. */
const LIMITS = { name: 200, preCondition: 1000, steps: 2000, expectedResult: 1000 } as const;
const MAX_TAGS = 5;
const MAX_TAG_LENGTH = 30;

type Category = GeneratedTestCase['category'];

/** 모델이 흔히 내는 분류 표기를 스키마 값으로 맞춘다. 모르면 undefined(스키마 기본값 positive). */
const CATEGORY_ALIASES: Record<string, Category> = {
  positive: 'positive',
  normal: 'positive',
  happy_path: 'positive',
  정상: 'positive',
  negative: 'negative',
  abnormal: 'negative',
  error: 'negative',
  exception: 'negative',
  비정상: 'negative',
  예외: 'negative',
  edge_case: 'edge_case',
  edge: 'edge_case',
  edgecase: 'edge_case',
  boundary: 'edge_case',
  엣지: 'edge_case',
  경계: 'edge_case',
};

const normalizeCategory = (value: unknown): Category | undefined => {
  if (typeof value !== 'string') return undefined;
  const key = value
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/_?케이스$/, '');
  return CATEGORY_ALIASES[key];
};

const clip = (value: string, max: number) => (value.length > max ? value.slice(0, max) : value);

/** 문자열이면 그대로, 배열이면 줄바꿈으로 잇는다. numbered 면 번호가 없는 줄에 번호를 붙인다. */
const toText = (value: unknown, numbered = false): string | undefined => {
  if (typeof value === 'string') return value.trim();
  if (!Array.isArray(value)) return undefined;
  const lines = value
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .filter((v) => v.length > 0);
  if (!numbered) return lines.join('\n');
  return lines.map((line, i) => (/^\d+[.)]\s/.test(line) ? line : `${i + 1}. ${line}`)).join('\n');
};

const toTags = (value: unknown): string[] | undefined => {
  const raw = typeof value === 'string' ? value.split(',') : Array.isArray(value) ? value : null;
  if (!raw) return undefined;
  const tags = raw
    .filter((t): t is string => typeof t === 'string')
    .map((t) => clip(t.trim().replace(/^#/, ''), MAX_TAG_LENGTH))
    .filter((t) => t.length > 0);
  return [...new Set(tags)].slice(0, MAX_TAGS);
};

/**
 * 항목 하나를 스키마에 맞게 다듬는다. 이름이 없으면 null.
 * 모델 출력은 필드명·형식이 조금씩 흔들리므로(steps 를 배열로, tags 6개 등) 버리기보다 맞춰 쓴다.
 */
const normalizeCase = (item: unknown): GeneratedTestCase | null => {
  if (!item || typeof item !== 'object') return null;
  const o = item as Record<string, unknown>;

  const name = toText(o.name ?? o.title);
  if (!name) return null;

  const candidate = {
    name: clip(name, LIMITS.name),
    preCondition: clip(toText(o.preCondition ?? o.precondition) ?? '', LIMITS.preCondition),
    steps: clip(toText(o.steps, true) ?? '', LIMITS.steps),
    expectedResult: clip(toText(o.expectedResult ?? o.expected) ?? '', LIMITS.expectedResult),
    tags: toTags(o.tags) ?? [],
    category: normalizeCategory(o.category ?? o.type),
  };
  const parsed = GeneratedTestCaseSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
};

/** `{ "cases": [...] }` 와 맨 배열 `[...]` 두 형식을 모두 받는다. */
const pickItems = (json: unknown): unknown[] | null => {
  if (Array.isArray(json)) return json;
  if (json && typeof json === 'object') {
    const o = json as Record<string, unknown>;
    const list = o.cases ?? o.testCases ?? o.test_cases;
    if (Array.isArray(list)) return list;
  }
  return null;
};

export interface ParseCasesResult {
  cases: GeneratedTestCase[];
  /** 형식이 맞지 않아 버린 항목 수 */
  dropped: number;
  /** 응답이 잘려 완결된 앞부분만 건졌는지 */
  salvaged: boolean;
}

/**
 * LLM 원문을 테스트 케이스 목록으로 바꾼다.
 * - 항목 하나가 깨졌다고 전체를 버리지 않는다(예전에는 tags 6개 하나로 응답 전체가 실패했다).
 * - truncated 면 JSON 이 닫히지 않으므로 완결된 객체만 건진다.
 * 쓸 수 있는 항목이 하나도 없으면 예외를 던진다.
 */
export const parseGeneratedCases = (raw: string, truncated = false): ParseCasesResult => {
  let items: unknown[] | null = null;
  let salvaged = false;
  try {
    items = pickItems(extractJson(raw));
  } catch {
    // 아래에서 잘린 응답이면 건지고, 아니면 목록 없음으로 처리한다.
  }
  if (!items && truncated) {
    items = salvageArrayObjects(raw);
    salvaged = true;
  }
  if (!items) throw new SyntaxError('LLM 응답에서 테스트 케이스 목록을 찾지 못했습니다.');

  const cases = items.map(normalizeCase).filter((c): c is GeneratedTestCase => c !== null);
  if (cases.length === 0) throw new SyntaxError('LLM 응답에 쓸 수 있는 테스트 케이스가 없습니다.');
  return { cases, dropped: items.length - cases.length, salvaged };
};
