import { Button, Select } from '@/shared/ui';

import {
  selectContentClassName,
  selectItemClassName,
  selectTriggerClassName,
  selectValueClassName,
} from './select-styles';

export function DashboardHeader() {
  return (
    <header className="border-border sticky top-0 z-10 border-b bg-white/95 px-5 py-4 backdrop-blur lg:px-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="text-xs font-semibold text-[#155DFC]">사용량 및 분석 대시보드</p>
          <h1
            id="dashboard-title"
            className="tracking-zero text-text-primary mt-1 text-2xl font-bold"
          >
            대시보드
          </h1>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="w-full sm:w-36">
            <Select.Root defaultValue="30d" size="md">
              <Select.Trigger aria-label="기간 선택" className={selectTriggerClassName}>
                <Select.Value placeholder="기간" className={selectValueClassName} />
              </Select.Trigger>
              <Select.Content className={selectContentClassName}>
                <Select.Item value="7d" className={selectItemClassName}>
                  최근 7일
                </Select.Item>
                <Select.Item value="30d" className={selectItemClassName}>
                  최근 30일
                </Select.Item>
                <Select.Item value="90d" className={selectItemClassName}>
                  최근 90일
                </Select.Item>
              </Select.Content>
            </Select.Root>
          </div>
          {/* 내보내기 미구현: 동작 전까지 비활성으로 의도를 드러낸다. */}
          <Button variant="outlined" className="bg-white" disabled title="준비 중">
            내보내기
          </Button>
        </div>
      </div>
    </header>
  );
}
