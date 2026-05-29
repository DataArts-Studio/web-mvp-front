export const ANALYSIS_SYSTEM_PROMPT = `당신은 소프트웨어 QA 및 요구사항 분석 전문가입니다.
사용자가 제공한 요구사항을 분석하여 (1) 요구사항 분석서와 (2) 테스트 시나리오를 생성합니다.

규칙:
1. 요구사항을 기능 요구사항(functionalRequirements)과 비기능 요구사항(nonFunctionalRequirements)으로 분리
2. 각 기능 요구사항에는 "FR-1", "FR-2" 형식의 고유 id 부여
3. 제약사항(constraints)·가정(assumptions)·확인이 필요한 미해결 질문(openQuestions)을 도출
4. 테스트 시나리오는 케이스 상위의 흐름/상황 단위로 작성. 정상(positive)/비정상(negative)/엣지(edge_case)를 균형있게 3~12개
5. 각 시나리오는 relatedRequirementIds 로 관련 기능 요구사항 id 를 참조
6. 반드시 JSON 객체만 반환. 다른 텍스트 없이 JSON만 출력

출력 형식 (JSON 객체):
{
  "analysis": {
    "title": "분석서 제목",
    "summary": "요구사항 요약 (줄바꿈은 \\n 사용)",
    "functionalRequirements": [
      { "id": "FR-1", "title": "요구사항 제목", "description": "상세 설명" }
    ],
    "nonFunctionalRequirements": [
      { "category": "성능 | 보안 | 사용성 등", "description": "상세 설명" }
    ],
    "constraints": ["제약사항1"],
    "assumptions": ["가정1"],
    "openQuestions": ["확인이 필요한 질문1"]
  },
  "scenarios": [
    {
      "name": "시나리오 이름",
      "description": "시나리오 설명 (줄바꿈은 \\n 사용)",
      "type": "positive | negative | edge_case",
      "relatedRequirementIds": ["FR-1"]
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

export interface AnalysisPromptInputs {
  /** 사용자가 직접 입력한 요구사항 텍스트. 첨부와 동시 입력 시 보조 컨텍스트로 합성. */
  description?: string;
  attachment?: AttachmentForPrompt;
  language: 'ko' | 'en';
}

/**
 * 사용자 프롬프트 합성. ai-generate 의 buildUserPrompt 와 동일 구조를 따른다.
 *
 * - description + attachment 동시 입력 시 attachment 본문 → description 순으로 배치.
 * - attachment 가 잘렸으면 LLM 에게 "원본의 앞부분만 받았다" 라고 명시한다.
 */
export const buildAnalysisPrompt = (inputs: AnalysisPromptInputs): string => {
  const langLabel = inputs.language === 'ko' ? '한국어' : 'English';

  const sections: string[] = [
    `다음 요구사항을 분석해 요구사항 분석서와 테스트 시나리오를 ${langLabel}로 생성해주세요.`,
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
