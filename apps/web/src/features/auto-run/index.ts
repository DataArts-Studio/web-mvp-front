/**
 * FDD-TR10 자동 실행(auto-run) feature.
 *
 * frontend(버튼)는 useRunAutomatedTest 훅으로 runAutomatedTest 서버액션을 호출한다.
 * 러너 호출/캡처/spec 생성/결과 기록은 모두 서버 측에서 일어난다.
 */
export {
  runAutomatedTest,
  type RunAutomatedTestParams,
  type RunAutomatedTestData,
} from './api/run-automated-test';
export { useRunAutomatedTest } from './hooks/use-run-automated-test';
