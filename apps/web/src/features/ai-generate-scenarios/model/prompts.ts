export const SCENARIO_SYSTEM_PROMPT = `당신은 소프트웨어 QA 전문가입니다.
사용자가 제공한 요구사항·맥락을 바탕으로 테스트 시나리오를 생성합니다.

규칙:
1. 시나리오는 테스트 케이스 상위의 흐름/상황 단위로 작성 (개별 케이스가 아닌 시나리오 수준)
2. 정상(positive)/비정상(negative)/엣지(edge_case)를 균형있게 3~12개 생성
3. 각 시나리오는 name(이름)과 description(설명)을 가진다
4. relatedRequirementIds 는 입력에 요구사항 id 가 있을 때만 채우고, 없으면 빈 배열
5. 반드시 JSON 객체만 반환. 다른 텍스트 없이 JSON만 출력

출력 형식 (JSON 객체):
{
  "scenarios": [
    {
      "name": "시나리오 이름",
      "description": "시나리오 설명 (줄바꿈은 \\n 사용)",
      "type": "positive | negative | edge_case",
      "relatedRequirementIds": []
    }
  ]
}`;

export interface ScenarioPromptInputs {
  description: string;
  language: 'ko' | 'en';
}

/** 시나리오 생성용 사용자 프롬프트 합성. */
export const buildScenarioPrompt = (inputs: ScenarioPromptInputs): string => {
  const langLabel = inputs.language === 'ko' ? '한국어' : 'English';
  return [
    `다음 요구사항·맥락을 바탕으로 테스트 시나리오를 ${langLabel}로 생성해주세요.`,
    `요구사항:\n${inputs.description}`,
  ].join('\n\n');
};
