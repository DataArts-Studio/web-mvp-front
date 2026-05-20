export const TEST_TYPE_OPTIONS = [
  { value: 'functional', label: '기능 테스트' },
  { value: 'ui', label: 'UI 테스트' },
  { value: 'api', label: 'API 테스트' },
  { value: 'e2e', label: 'E2E 테스트' },
  { value: 'performance', label: '성능 테스트' },
  { value: 'security', label: '보안 테스트' },
  { value: 'regression', label: '회귀 테스트' },
  { value: 'smoke', label: '스모크 테스트' },
  { value: 'other', label: '기타' },
] as const;

export type TestTypeValue = (typeof TEST_TYPE_OPTIONS)[number]['value'];

export function getTestTypeLabel(value: string): string {
  return TEST_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}
