import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * React/Tailwind 프로젝트에서 className 문자열을 안전하게 병합하기 위한 유틸리티 함수입니다.
 *
 * 내부적으로 `clsx`로 조건부 클래스 처리를 하고,
 * `tailwind-merge`로 Tailwind의 우선순위 충돌을 자동으로 해결합니다.
 *
 * 예시
 * cn("p-2", isActive && "bg-blue-500", "p-4")
 * → "p-4 bg-blue-500"
 *
 * 사용 목적
 * - 조건부 className 처리
 * - Tailwind 클래스 충돌 해결 (p-2 vs p-4 등)
 * - 컴포넌트 스타일 유틸(buttonCn, inputCn 등)의 기반 함수로 사용
 *
 * 확장 포인트
 * - 프로젝트 스타일 가이드에 맞춘 component-level 유틸리티 생성 가능
 * - Tailwind를 제거해도 내부 구현만 교체하면 외부 호출부는 동일하게 유지됨
 *
 * @param {...ClassValue[]} inputs - 문자열, 배열, 객체 등 clsx가 허용하는 모든 입력
 * @returns {string} Tailwind 우선순위 규칙을 적용하여 병합된 className 문자열
 *
 * @example
 * cn("px-2 py-1", isActive && "bg-blue-500", "px-4");
 * // "py-1 bg-blue-500 px-4"
 *
 * @example
 * cn("text-sm", ["font-medium", condition && "opacity-50"]);
 * // "text-sm font-medium opacity-50"
 */
export const cn = (...inputs: ClassValue[]): string => {
  return twMerge(clsx(inputs));
};
