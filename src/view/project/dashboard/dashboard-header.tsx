import { OnboardingButton } from './onboarding-button';

export const DashboardHeader = () => {
  return (
    <header className="border-line-2 col-span-6 flex items-start justify-between border-b pb-6">
      <div className="flex flex-col gap-1">
        <h1 className="typo-h1-heading text-text-1">대시보드</h1>
        <p className="typo-body2-normal text-text-2">
          클릭 몇 번이면 뚝딱! 테스트 케이스를 자동으로 만들어보세요.
        </p>
      </div>
      <OnboardingButton />
    </header>
  );
};
