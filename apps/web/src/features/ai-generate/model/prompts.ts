export const SYSTEM_PROMPT = `당신은 소프트웨어 QA 전문가입니다.
사용자가 제공한 기능 설명을 분석하여 테스트 케이스를 생성합니다.

규칙:
1. 정상 케이스(positive), 비정상 케이스(negative), 엣지 케이스를 균형있게 생성
2. 각 TC는 독립적으로 실행 가능해야 함
3. 테스트 스텝은 구체적이고 재현 가능하게 작성
4. 5~15개의 TC를 생성 (입력 복잡도에 따라 조절)
5. 반드시 JSON 배열만 반환. 다른 텍스트 없이 JSON만 출력

출력 형식 (JSON 배열):
[
  {
    "name": "테스트 케이스 이름",
    "preCondition": "사전 조건 (줄바꿈은 \\n 사용)",
    "steps": "1. 첫 번째 단계\\n2. 두 번째 단계\\n3. 세 번째 단계",
    "expectedResult": "기대 결과 (줄바꿈은 \\n 사용)",
    "tags": ["태그1", "태그2"],
    "category": "positive | negative | edge_case"
  }
]`;

export interface AttachmentForPrompt {
  type: 'pdf' | 'markdown';
  filename: string;
  text: string;
  /** MAX_EXTRACTED_CHARS 초과로 잘렸는지 (잘렸으면 LLM 에게도 안내) */
  truncated: boolean;
}

export interface UserPromptInputs {
  /** 사용자가 직접 입력한 자유 텍스트. 첨부와 동시 입력 시 보조 컨텍스트로 합성. */
  description?: string;
  attachment?: AttachmentForPrompt;
  language: 'ko' | 'en';
}

/**
 * 사용자 프롬프트 합성.
 *
 * - description + attachment 동시 입력 시 attachment 본문 → description 순으로 배치.
 *   첨부 문서가 보통 더 풍부한 컨텍스트라 LLM 이 그것을 우선 참조하도록 함.
 * - attachment 가 잘렸으면 LLM 에게 "원본의 앞부분만 받았다" 라고 명시해서
 *   결과의 신뢰도를 과대평가하지 않게 한다.
 */
export const buildUserPrompt = (inputs: UserPromptInputs): string => {
  const langLabel = inputs.language === 'ko' ? '한국어' : 'English';

  const sections: string[] = [`다음 자료를 분석해 테스트 케이스를 ${langLabel}로 생성해주세요.`];

  if (inputs.attachment) {
    const { type, filename, text, truncated } = inputs.attachment;
    const typeLabel = type === 'pdf' ? 'PDF' : 'Markdown';
    const truncationNote = truncated
      ? '\n(원본이 길어 앞부분만 발췌됨. 잘린 뒷부분은 알 수 없음.)'
      : '';
    sections.push(`첨부 문서 (${typeLabel}, 파일명: ${filename})${truncationNote}:\n${text}`);
  }

  if (inputs.description && inputs.description.trim().length > 0) {
    const label = inputs.attachment ? '추가 설명' : '기능 설명';
    sections.push(`${label}:\n${inputs.description}`);
  }

  return sections.join('\n\n');
};
