import { Loader2 } from 'lucide-react';

export const AiGeneratingSpinner = () => (
  <div className="flex flex-col items-center gap-4 py-16">
    <Loader2 className="h-10 w-10 animate-spin text-primary" />
    <div className="flex flex-col items-center gap-1">
      <p className="typo-body1-heading text-text-1">AI가 테스트 케이스를 생성하고 있습니다</p>
      <p className="typo-body2-normal text-text-3">잠시만 기다려주세요...</p>
    </div>
  </div>
);
