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

export interface AttachmentForPrompt {
  type: 'pdf' | 'markdown';
  filename: string;
  text: string;
  /** 추출 한도 초과로 잘렸는지 (잘렸으면 LLM 에게도 안내) */
  truncated: boolean;
}

export interface ScenarioPromptInputs {
  /** 사용자가 직접 입력한 요구사항 텍스트. 첨부와 동시 입력 시 보조 컨텍스트로 합성. */
  description?: string;
  attachment?: AttachmentForPrompt;
  language: 'ko' | 'en';
}

/**
 * 시나리오 생성용 사용자 프롬프트 합성. ai-requirement-analysis 의 buildAnalysisPrompt 와 동일 구조.
 *
 * - description + attachment 동시 입력 시 attachment 본문 → description 순으로 배치.
 * - attachment 가 잘렸으면 LLM 에게 "원본의 앞부분만 받았다" 라고 명시한다.
 */
export const buildScenarioPrompt = (inputs: ScenarioPromptInputs): string => {
  const langLabel = inputs.language === 'ko' ? '한국어' : 'English';

  const sections: string[] = [
    `다음 요구사항·맥락을 바탕으로 테스트 시나리오를 ${langLabel}로 생성해주세요.`,
  ];

  if (inputs.attachment) {
    const { type, filename, text, truncated } = inputs.attachment;
    const typeLabel = type === 'pdf' ? 'PDF' : 'Markdown';
    const truncationNote = truncated
      ? '\n(원본이 길어 앞부분만 발췌됨. 잘린 뒷부분은 알 수 없음.)'
      : '';
    sections.push(`첨부 문서 (${typeLabel}, 파일명: ${filename})${truncationNote}:\n${text}`);
  }

  if (inputs.description && inputs.description.trim().length > 0) {
    const label = inputs.attachment ? '추가 설명' : '요구사항';
    sections.push(`${label}:\n${inputs.description}`);
  }

  return sections.join('\n\n');
};
