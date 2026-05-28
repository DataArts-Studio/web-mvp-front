import { Loader2 } from 'lucide-react';

export const RequirementAnalysisSpinner = () => (
  <div className="flex flex-col items-center gap-4 py-16">
    <Loader2 className="text-primary h-10 w-10 animate-spin" />
    <div className="flex flex-col items-center gap-1">
      <p className="typo-body1-heading text-text-1">
        AI가 요구사항을 분석하고 시나리오를 만들고 있습니다
      </p>
      <p className="typo-body2-normal text-text-3">잠시만 기다려주세요...</p>
    </div>
  </div>
);
