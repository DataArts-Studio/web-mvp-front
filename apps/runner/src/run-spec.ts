import { spawn } from 'node:child_process';
import { chmod, mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * 순수 Playwright 실행기. DB 에 접근하지 않는다.
 *
 * PoC 에서 확정한 운영 교훈을 그대로 반영한다:
 * - 요청마다 격리된 임시 디렉터리 + 자체 playwright config 를 생성한다 (기존 앱 config 미사용).
 * - @playwright/test CLI 를 child_process 로 실행하되 workers=1, stdio 분리, 하드 타임아웃을 건다.
 * - 결과는 stdout 이 아니라 JSON reporter outputFile 에서 파싱한다 (버퍼 hang 회피).
 * - 결과 파싱은 stats.expected/unexpected + 첫 test result 의 status/duration/error.message 기준.
 */

export interface RunSpecInput {
  /** 실행할 단일 Playwright spec 의 소스 코드. 임의 코드 실행이므로 격리 컨테이너 전제. */
  spec: string;
  /** config use.baseURL 로 주입. 대상 사이트 주소. */
  baseUrl?: string;
  /**
   * config use.storageState 로 주입. Testea 가 대상 인증으로 구성해 전달하는
   * 쿠키/오리진 인증 상태 객체. (러너는 복호화/인증 구성을 하지 않는다.)
   */
  storageState?: unknown;
  /** 전체 실행 하드 타임아웃 (ms). 기본 60s. */
  timeoutMs?: number;
}

export interface RunSpecResult {
  /** 기대대로 통과했는지 (expected > 0 && unexpected === 0). */
  ok: boolean;
  /** 첫 test result 의 status: passed | failed | timedOut | skipped | interrupted | unknown. */
  status: string;
  /** 첫 test result 의 duration(ms). 없으면 전체 경과시간. */
  durationMs: number;
  /** 실패/타임아웃 시 첫 에러 메시지. 정상 통과 시 undefined. */
  errorMessage?: string;
}

const DEFAULT_TIMEOUT_MS = 60_000;

/**
 * spec 자식 프로세스에 넘길 환경변수 allowlist.
 * Playwright/Node 실행에 필요한 키만 통과시키고, RUNNER_SHARED_SECRET 등 시크릿은 제외한다.
 */
const ALLOWED_CHILD_ENV_KEYS = [
  'PATH',
  'HOME',
  'TMPDIR',
  'TEMP',
  'TMP',
  'LANG',
  'LC_ALL',
  'LC_CTYPE',
  'NODE_PATH',
  'PLAYWRIGHT_BROWSERS_PATH',
  'PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD',
];

function buildChildEnv(runDir: string): NodeJS.ProcessEnv {
  // 컨테이너 내장 브라우저 경로 재사용 (베이스 이미지 ms-playwright).
  const env: NodeJS.ProcessEnv = { CI: '1' };
  for (const key of ALLOWED_CHILD_ENV_KEYS) {
    const value = process.env[key];
    if (value !== undefined) env[key] = value;
  }
  // spec 의 HOME/TMPDIR 를 요청별 디렉터리로 고정한다. 임의 코드가 공유 임시 경로
  // (예: /tmp)에 쓰거나 거기서 다른 run 의 산출물을 줍는 표면을 줄인다. 이 디렉터리는
  // 실행 종료 후 rm 으로 회수된다. (동시 run 간 완전 격리는 컨테이너-per-run 이 본 수단.)
  env.HOME = runDir;
  env.TMPDIR = runDir;
  env.TEMP = runDir;
  env.TMP = runDir;
  return env;
}

/**
 * 러너 앱 루트 (이 모듈 기준 dist/ 또는 src/ 의 상위).
 * 임시 실행 디렉터리를 이 루트 아래에 만들어, 생성한 playwright config 가
 * @playwright/test 를 트리 상위 node_modules 에서 해석할 수 있게 한다.
 * os tmpdir 에 두면 pnpm 심볼릭 레이아웃에서 모듈 해석이 깨진다.
 */
const APP_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const RUNS_ROOT = join(APP_ROOT, '.runs');

/** child_process 환경에서 @playwright/test CLI 진입점 경로를 해석한다. */
function resolvePlaywrightCli(): string {
  const require = createRequire(import.meta.url);
  // @playwright/test 의 cli 진입점. 패키지 내부 cli.js 를 직접 해석.
  return require.resolve('@playwright/test/cli');
}

/** 임시 디렉터리에 자체 playwright config 와 spec 파일을 쓴다. */
async function writeRunFiles(
  dir: string,
  input: RunSpecInput
): Promise<{ specPath: string; configPath: string; reportPath: string }> {
  const specPath = join(dir, 'run.spec.ts');
  const configPath = join(dir, 'playwright.config.ts');
  const reportPath = join(dir, 'report.json');
  const storageStatePath = join(dir, 'storage-state.json');

  await writeFile(specPath, input.spec, 'utf8');

  const useEntries: string[] = [];
  if (input.baseUrl) {
    useEntries.push(`baseURL: ${JSON.stringify(input.baseUrl)}`);
  }
  if (input.storageState !== undefined && input.storageState !== null) {
    // storageState 는 대상 사이트의 복호화된 인증쿠키를 담을 수 있다. 소유자만 읽도록
    // 0600 으로 기록해, 같은 컨테이너에서 도는 다른(비신뢰) spec 의 우발적 노출을 줄인다.
    await writeFile(storageStatePath, JSON.stringify(input.storageState), {
      encoding: 'utf8',
      mode: 0o600,
    });
    useEntries.push(`storageState: ${JSON.stringify(storageStatePath)}`);
  }
  // chromium 만 사용 (베이스 이미지 내장 브라우저 재사용, 추가 다운로드 최소화).
  useEntries.push(`browserName: 'chromium'`);

  const config = `import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: ${JSON.stringify(dir)},
  testMatch: ${JSON.stringify('run.spec.ts')},
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['json', { outputFile: ${JSON.stringify(reportPath)} }]],
  use: {
    ${useEntries.join(',\n    ')},
  },
});
`;
  await writeFile(configPath, config, 'utf8');

  return { specPath, configPath, reportPath };
}

/** Playwright 에러 메시지의 ANSI 색상 코드를 제거한다 (Testea 기록용 평문). */
const ANSI_PATTERN = new RegExp(`${String.fromCharCode(27)}\\[[0-9;]*m`, 'g');
function stripAnsi(value: string | undefined): string | undefined {
  return value?.replace(ANSI_PATTERN, '');
}

/** Playwright JSON reporter 산출물에서 첫 test result 를 끌어낸다. */
function parseReport(raw: string): RunSpecResult {
  const report = JSON.parse(raw) as PlaywrightJsonReport;

  const expected = report.stats?.expected ?? 0;
  const unexpected = report.stats?.unexpected ?? 0;
  const ok = expected > 0 && unexpected === 0;

  const firstResult = findFirstResult(report);
  const status = firstResult?.status ?? (ok ? 'passed' : 'unknown');
  const durationMs = firstResult?.duration ?? report.stats?.duration ?? 0;
  const errorMessage = stripAnsi(firstResult?.errors?.[0]?.message ?? firstResult?.error?.message);

  return {
    ok,
    status,
    durationMs,
    errorMessage: ok ? undefined : errorMessage,
  };
}

function findFirstResult(report: PlaywrightJsonReport): PwTestResult | undefined {
  for (const suite of report.suites ?? []) {
    const found = findResultInSuite(suite);
    if (found) return found;
  }
  return undefined;
}

function findResultInSuite(suite: PwSuite): PwTestResult | undefined {
  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests ?? []) {
      const result = test.results?.[0];
      if (result) return result;
    }
  }
  for (const child of suite.suites ?? []) {
    const found = findResultInSuite(child);
    if (found) return found;
  }
  return undefined;
}

export async function runSpec(input: RunSpecInput): Promise<RunSpecResult> {
  const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const startedAt = Date.now();
  await mkdir(RUNS_ROOT, { recursive: true });
  const dir = await mkdtemp(join(RUNS_ROOT, 'run-'));
  // 요청별 디렉터리를 소유자 전용(0700)으로 고정한다. mkdtemp 가 기본 0700 이지만
  // umask 영향 없이 명시적으로 보장한다 (storage-state.json 등 민감 산출물 보호).
  await chmod(dir, 0o700);

  try {
    const { configPath, reportPath } = await writeRunFiles(dir, input);
    const cli = resolvePlaywrightCli();

    await new Promise<void>((resolve) => {
      const child = spawn(process.execPath, [cli, 'test', '--config', configPath, '--workers=1'], {
        cwd: dir,
        // stdout/stderr 버퍼 hang 회피: 결과는 reporter outputFile 로만 읽는다.
        stdio: 'ignore',
        // 임의 코드(spec)에 전체 env 를 상속하지 않는다. RUNNER_SHARED_SECRET 등
        // 시크릿 유출 방지를 위해 Playwright 실행에 필요한 키만 allowlist 로 전달한다.
        env: buildChildEnv(dir),
        // 자체 프로세스 그룹으로 띄운다. 타임아웃 강제 종료 시 @playwright/test 가
        // 띄운 Chromium 손자 프로세스까지 그룹 단위로 회수하기 위함이다. detached 는
        // unref 가 아니므로 부모는 아래 close 까지 그대로 대기한다. (러너는 Linux 컨테이너 전제)
        detached: true,
      });

      // 직접 자식(node CLI)만 죽이면 Chromium 손자 프로세스가 고아로 남아
      // 메모리/CPU 를 누수한다. child.pid 를 음수로 넘겨 프로세스 그룹 전체를 종료한다.
      const killGroup = () => {
        if (child.pid === undefined) return;
        try {
          process.kill(-child.pid, 'SIGKILL');
        } catch {
          // 이미 종료됐거나(ESRCH) 그룹이 없으면 무시한다.
        }
      };

      const killer = setTimeout(killGroup, timeoutMs);

      child.on('error', () => {
        clearTimeout(killer);
        resolve();
      });
      child.on('close', () => {
        clearTimeout(killer);
        resolve();
      });
    });

    let raw: string | undefined;
    try {
      raw = await readFile(reportPath, 'utf8');
    } catch {
      raw = undefined;
    }

    if (!raw) {
      // reporter 산출물이 없으면 (타임아웃 강제종료/크래시) 실패로 본다.
      return {
        ok: false,
        status: 'timedOut',
        durationMs: Date.now() - startedAt,
        errorMessage: 'Run produced no report (timed out or crashed).',
      };
    }

    return parseReport(raw);
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

// --- Playwright JSON reporter 최소 타입 (필요 필드만) ---

interface PlaywrightJsonReport {
  stats?: {
    expected?: number;
    unexpected?: number;
    duration?: number;
  };
  suites?: PwSuite[];
}

interface PwSuite {
  specs?: PwSpec[];
  suites?: PwSuite[];
}

interface PwSpec {
  tests?: PwTest[];
}

interface PwTest {
  results?: PwTestResult[];
}

interface PwTestResult {
  status?: string;
  duration?: number;
  error?: { message?: string };
  errors?: Array<{ message?: string }>;
}
