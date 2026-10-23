import { callLlm } from '@/entities/ai-config/api/call-llm';
import 'server-only';

/**
 * 케이스 자연어 steps + 대상 페이지 접근성 트리 → Playwright spec 코드 LLM 생성.
 *
 * - 모델: 프로젝트에 등록한 AI 설정(제공자·키·모델)을 쓴다. 서비스 소유 키로는 호출하지 않는다.
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

/** LLM 응답 대기 상한. 응답이 멈춰도 서버 액션이 무한히 붙잡히지 않게 한다. */
const SPEC_TIMEOUT_MS = 60_000;

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
  /** 프로젝트에 등록한 AI 설정(복호화된 키). */
  llm: { provider: string; apiKey: string; model: string | null };
  steps: string;
  snapshot: string;
  caseTitle: string;
  /** 케이스가 가리키는 경로(상대). 없으면 모델이 트리 기준으로 판단. */
  path?: string;
  /** 이전 생성본이 정적 검증에 걸렸을 때 다시 생성하도록 넘기는 지적 사항. */
  retry?: { previousSpec: string; issues: string[] };
}): Promise<string> {
  const userPrompt = [
    `케이스 제목: ${input.caseTitle}`,
    input.path ? `대상 경로: ${input.path}` : '',
    '',
    '자연어 단계:',
    input.steps,
    '',
    '대상 페이지 접근성 트리:',
    input.snapshot,
    ...(input.retry
      ? [
          '',
          '이전에 생성한 코드가 접근성 트리에 없는 요소를 가리켰다. 아래 지적을 반영해 트리에 있는 요소로만 다시 작성한다.',
          ...input.retry.issues.map((issue) => `- ${issue}`),
          '',
          '이전 코드:',
          input.retry.previousSpec,
        ]
      : []),
  ]
    .filter((line) => line !== '')
    .join('\n');

  // 제공자 오류(키 무효, 한도 등)는 AiError 로 올라가 호출부에서 사용자 안내로 바꾼다.
  const text = await callLlm(input.llm, SPEC_SYSTEM_PROMPT, userPrompt, {
    temperature: 0.1,
    maxTokens: 2048,
    timeoutMs: SPEC_TIMEOUT_MS,
  });
  if (!text.trim()) {
    throw new SpecGenerationError('LLM returned empty spec.');
  }

  const spec = stripCodeFence(text);
  if (!spec.includes('@playwright/test')) {
    throw new SpecGenerationError('Generated spec does not look like a Playwright spec.');
  }
  return spec;
}
