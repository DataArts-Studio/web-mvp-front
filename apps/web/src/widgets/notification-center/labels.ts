import { useTranslations } from 'next-intl';

/**
 * 공지 카테고리·심각도 라벨을 현재 로케일로 변환하는 훅 (고객 측 UI 용).
 * 알 수 없는 값은 원본을 그대로 노출(폴백)한다.
 */
export function useAnnouncementLabels() {
  const t = useTranslations('notifications');
  return {
    category: (category: string) =>
      t.has(`category.${category}`) ? t(`category.${category}`) : category,
    severity: (severity: string) =>
      t.has(`severity.${severity}`) ? t(`severity.${severity}`) : severity,
  };
}
