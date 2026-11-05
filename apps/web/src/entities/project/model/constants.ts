export const PROJECT_NAME_ERRORS = {
  REQUIRED: '프로젝트 이름을 입력해주세요.',
  MAX_LENGTH: '프로젝트 이름은 최대 50글자 이하여야 합니다.',
  // 이름 유니크 제약은 삭제한 프로젝트까지 포함한다.
  TAKEN:
    '이미 사용 중인 프로젝트 이름입니다. 삭제한 프로젝트의 이름도 다시 쓸 수 없으니 다른 이름을 입력해주세요.',
} as const;

export const IDENTIFIER_ERRORS = {
  REQUIRED: '프로젝트 식별번호를 입력해주세요.',
  CONFIRM_REQUIRED: '프로젝트 식별번호를 한 번 더 입력해주세요',
  MISMATCH: '프로젝트 식별번호가 일치하지 않습니다.',
  MAX_LENGTH: '프로젝트 식별번호는 최대 16글자 이하여야 합니다.',
} as const;

export const OWNER_ERRORS = {
  MAX_LENGTH: '프로젝트 식별번호는 최대 16글자 이하여야 합니다.',
} as const;

export const DESCRIPTION_ERRORS = {
  MAX_LENGTH: '프로젝트 설명은 300자를 넘을 수 없습니다.',
} as const;
