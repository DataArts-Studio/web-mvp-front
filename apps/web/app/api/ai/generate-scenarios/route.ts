import { NextRequest, NextResponse } from 'next/server';

import { requireProjectAccess } from '@/access/lib/require-access';
import { getDecryptedApiKey } from '@/entities/ai-config/api/decrypt-api-key';
import { AiError } from '@/entities/ai-config/model/ai-error';
import { getMonthlyUsage, recordUsage } from '@/entities/ai-usage/api/server-actions';
import { callLlm, parseJsonResponse } from '@/features/ai-generate-scenarios/lib/llm-client';
import {
  SCENARIO_SYSTEM_PROMPT,
  buildScenarioPrompt,
} from '@/features/ai-generate-scenarios/model/prompts';
import {
  GenerateScenariosResultSchema,
  GenerateScenariosSchema,
} from '@/features/ai-generate-scenarios/model/schema';
import * as Sentry from '@sentry/nextjs';

/**
 * 시나리오 AI 생성. 요구사항·맥락 텍스트를 받아 테스트 시나리오 배열을 생성한다.
 * 분석서 없이 시나리오만 만들며, 결과는 클라이언트에서 선택해 test_scenarios 로 저장한다.
 */
export async function POST(req: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: '요청 본문이 올바른 JSON 형식이 아닙니다.' },
        { status: 400 }
      );
    }

    const parsed = GenerateScenariosSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? '요청 값이 올바르지 않습니다.' },
        { status: 400 }
      );
    }
    const { projectId, description, language } = parsed.data;

    if (!(await requireProjectAccess(projectId))) {
      return NextResponse.json({ error: '프로젝트 접근 권한이 없습니다.' }, { status: 401 });
    }

    const config = await getDecryptedApiKey(projectId);
    if (!config) {
      return NextResponse.json(
        { error: 'AI 설정이 되어 있지 않습니다. 설정 페이지에서 API 키를 등록해주세요.' },
        { status: 400 }
      );
    }

    let usageRemaining = Number.POSITIVE_INFINITY;
    const usageResult = await getMonthlyUsage(projectId);
    if (usageResult.success) {
      const { used, limit } = usageResult.data;
      if (used >= limit) {
        return NextResponse.json(
          { error: `이번 달 사용 한도(${limit}건)를 초과했습니다. 다음 달에 다시 이용해주세요.` },
          { status: 429 }
        );
      }
      usageRemaining = limit - used;
    }

    const userPrompt = buildScenarioPrompt({ description, language });
    const rawResponse = await callLlm(config, SCENARIO_SYSTEM_PROMPT, userPrompt);

    let result;
    try {
      result = GenerateScenariosResultSchema.parse(parseJsonResponse(rawResponse));
    } catch (error) {
      throw AiError.responseUnparsable(error);
    }

    // 남은 월간 한도를 넘지 않게 잘라 채택하고 그만큼만 사용량에 집계한다.
    const limitedScenarios = result.scenarios.slice(0, usageRemaining);
    await recordUsage(projectId, 'generate_scenarios', limitedScenarios.length);

    return NextResponse.json({ scenarios: limitedScenarios });
  } catch (error) {
    if (error instanceof AiError) {
      if (error.report) {
        Sentry.captureException(error, {
          extra: { action: 'generateScenarios', kind: error.kind, ...error.context },
        });
      }
      return NextResponse.json({ error: error.userMessage }, { status: error.httpStatus });
    }

    Sentry.captureException(error, { extra: { action: 'generateScenarios' } });
    return NextResponse.json(
      { error: '시나리오 생성에 실패했습니다. 다시 시도해주세요.' },
      { status: 500 }
    );
  }
}
