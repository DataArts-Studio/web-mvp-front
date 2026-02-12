'use client';

import { useEffect, useRef, useCallback } from 'react';
import type { Driver } from 'driver.js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { onboardingQueryOptions, onboardingQueryKeys } from '../api/query';
import { completeOnboardingTour } from '../api/server-actions';
import { TOUR_STEPS, TOTAL_STEPS } from '../config/tour-steps';
import { track } from '@/shared/lib/analytics';
import { ONBOARDING_EVENTS } from '@/shared/lib/analytics';

type UseOnboardingTourParams = {
  projectId: string | undefined;
  isDataLoaded: boolean;
};

let driverModuleLoaded = false;

async function loadDriverModule() {
  if (!driverModuleLoaded) {
    await import('driver.js/dist/driver.css');
    await import('../styles/onboarding.css');
    driverModuleLoaded = true;
  }
  const { driver } = await import('driver.js');
  return driver;
}

export function useOnboardingTour({ projectId, isDataLoaded }: UseOnboardingTourParams) {
  const driverRef = useRef<Driver | null>(null);
  const queryClient = useQueryClient();
  const hasStartedRef = useRef(false);

  const { data: statusData } = useQuery({
    ...onboardingQueryOptions.status(projectId!),
    enabled: !!projectId,
  });

  const completed = statusData?.success ? statusData.data.completed : true;

  const handleComplete = useCallback(
    async (lastStep: number, skipped: boolean) => {
      if (!projectId) return;

      track(skipped ? ONBOARDING_EVENTS.TOUR_SKIP : ONBOARDING_EVENTS.TOUR_COMPLETE, {
        project_id: projectId,
        last_step: lastStep,
      });

      await completeOnboardingTour(projectId, lastStep);
      queryClient.invalidateQueries({
        queryKey: onboardingQueryKeys.status(projectId),
      });
    },
    [projectId, queryClient],
  );

  const startTour = useCallback(async () => {
    if (driverRef.current) {
      driverRef.current.destroy();
    }

    const driver = await loadDriverModule();

    let currentStep = 0;

    const driverInstance = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      overlayColor: 'rgba(0, 0, 0, 0.7)',
      stagePadding: 8,
      stageRadius: 8,
      popoverClass: 'onboarding-popover',
      progressText: '{{current}} / {{total}}',
      nextBtnText: '다음',
      prevBtnText: '이전',
      doneBtnText: '완료',
      steps: TOUR_STEPS,
      onHighlightStarted: (_element, step) => {
        currentStep = TOUR_STEPS.indexOf(step);
        track(ONBOARDING_EVENTS.STEP_VIEW, {
          project_id: projectId ?? '',
          step: currentStep,
          step_title: step.popover?.title ?? '',
        });
      },
      onDestroyStarted: () => {
        const isLastStep = currentStep === TOTAL_STEPS - 1;
        if (driverInstance.hasNextStep() || !isLastStep) {
          handleComplete(currentStep, true);
        }
        driverInstance.destroy();
      },
      onDestroyed: () => {
        driverRef.current = null;
      },
      onFinished: () => {
        handleComplete(TOTAL_STEPS - 1, false);
      },
    });

    driverRef.current = driverInstance;
    track(ONBOARDING_EVENTS.TOUR_START, { project_id: projectId ?? '' });
    driverInstance.drive();
  }, [projectId, handleComplete]);

  // 자동 시작: 데이터 로드 완료 + 온보딩 미완료
  useEffect(() => {
    if (!isDataLoaded || completed || hasStartedRef.current || !projectId) return;

    hasStartedRef.current = true;
    const timer = setTimeout(() => {
      startTour();
    }, 500);

    return () => clearTimeout(timer);
  }, [isDataLoaded, completed, projectId, startTour]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (driverRef.current) {
        driverRef.current.destroy();
        driverRef.current = null;
      }
    };
  }, []);

  return {
    shouldShowTour: !completed,
    startTour,
  };
}
