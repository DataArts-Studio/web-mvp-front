/**
 * 공지 카테고리·심각도 라벨 매핑 (고객 측 UI 용).
 *
 * 어드민 측은 별도 입력값을 그대로 노출하지만, 고객 화면에는 한국어 라벨로 변환한다.
 */
export const CATEGORY_LABEL: Record<string, string> = {
  feature: '신규 기능',
  maintenance: '점검',
  policy: '정책',
  event: '이벤트',
  notice: '공지',
};

export const SEVERITY_LABEL: Record<string, string> = {
  info: '안내',
  warning: '주의',
  critical: '긴급',
};
