'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { dashboardQueryOptions } from '@/features/dashboard';
import { useOnboardingTour } from '@/features/onboarding-tour';
import { DSButton } from '@/shared/ui';
import { CircleHelp } from 'lucide-react';

export const OnboardingButton = () => {
  const params = useParams();
  const slug = params.slug as string;

  const { data: dashboardData } = useQuery({
    ...dashboardQueryOptions.stats(slug),
    enabled: !!slug,
  });

  const projectId = dashboardData?.success ? dashboardData.data.project.id : undefined;

  const { startTour } = useOnboardingTour({
    projectId,
    isDataLoaded: !!dashboardData?.success,
  });

  return (
    <DSButton variant="ghost" size="small" className="flex items-center gap-1.5" onClick={startTour} data-tour="guide-tour-btn">
      <CircleHelp className="h-4 w-4" />
      <span>온보딩</span>
    </DSButton>
  );
};
