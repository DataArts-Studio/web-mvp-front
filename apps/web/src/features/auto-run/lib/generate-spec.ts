import 'server-only';

/**
 * 케이스 자연어 steps + 대상 페이지 접근성 트리 → Playwright spec 코드 LLM 생성.
 *
 * PoC(2026-06-04)에서 확정한 레시피를 그대로 쓴다:
 * - 모델: gemini-2.5-flash-lite (REST generateContent). gemini-2.0-flash 는 이 키에서
 *   free quota 0(429) 이라 사용 금지. runs-share 의 요약과 동일 모델.
 * - 입력: steps + 실시간 접근성 트리(role/name/level).
 * - 규칙 프롬프트: 트리에 있는 role/name 만 getByRole, 추측 금지, 로딩 대비 첫 단언
 *   timeout 30s, 마크다운 펜스 금지.
 */

const SPEC_SYSTEM_PROMPT = `너는 Playwright(@playwright/test, TypeScript) 테스트 코드 생성기다.
입력으로 (1) 테스트 케이스의 자연어 단계, (2) 대상 페이지의 접근성 트리(aria snapshot)를 받는다.
아래 규칙을 반드시 지켜 단일 spec 파일 코드만 출력한다.

규칙:
- 출력은 순수 TypeScript 코드만. 마크다운 코드펜스(\`\`\`), 설명 문장, 주석 머리말 금지.
- import 는 \`import { test, expect } from '@playwright/test';\` 한 줄로 시작한다.
- test 는 정확히 하나. test('...', async ({ page }) => { ... }).
- 페이지 이동은 page.goto('/...') 처럼 상대 경로를 쓴다(baseURL 은 config 가 주입한다).
- 셀렉터는 제공된 접근성 트리에 실제로 존재하는 role/name 만 getByRole(role, { name }) 로 쓴다.
  트리에 없는 role/name/텍스트를 추측해서 만들지 않는다. 트리에 row role 이 없으면 getByText().first() 등으로 스코프한다.
- 같은 이름이 여러 번 나오면 .first() 등으로 단일 요소로 좁힌다.
- 첫 단언(또는 첫 상호작용 직전 대기)은 데이터 로딩 스켈레톤을 대비해 timeout 을 30000ms 로 넉넉히 준다.
- 자연어 단계의 검증 의도를 expect 단언으로 옮긴다.`;

export class SpecGenerationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SpecGenerationError';
  }
}

/** 혹시 모델이 펜스를 붙여 반환하면 제거한다(프롬프트로 금지하지만 안전망). */
function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:[a-zA-Z]+)?\n([\s\S]*?)\n```$/);
  return (fenced ? fenced[1] : trimmed).trim();
}

export async function generateSpec(input: {
  steps: string;
  snapshot: string;
  caseTitle: string;
  /** 케이스가 가리키는 경로(상대). 없으면 모델이 트리 기준으로 판단. */
  path?: string;
}): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new SpecGenerationError('GEMINI_API_KEY is not set.');
  }

  const userPrompt = [
    `케이스 제목: ${input.caseTitle}`,
    input.path ? `대상 경로: ${input.path}` : '',
    '',
    '자연어 단계:',
    input.steps,
    '',
    '대상 페이지 접근성 트리:',
    input.snapshot,
  ]
    .filter((line) => line !== '')
    .join('\n');

  let res: Response;
  try {
    res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SPEC_SYSTEM_PROMPT }] },
          contents: [{ parts: [{ text: userPrompt }] }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 2048 },
        }),
        cache: 'no-store',
      }
    );
  } catch (error) {
    throw new SpecGenerationError(
      `Gemini request failed: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  if (!res.ok) {
    throw new SpecGenerationError(`Gemini responded ${res.status}.`);
  }

  const data = await res.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text || !text.trim()) {
    throw new SpecGenerationError('Gemini returned empty spec.');
  }

  const spec = stripCodeFence(text);
  if (!spec.includes('@playwright/test')) {
    throw new SpecGenerationError('Generated spec does not look like a Playwright spec.');
  }
  return spec;
}
