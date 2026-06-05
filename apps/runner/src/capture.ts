import { chromium } from '@playwright/test';

/**
 * 대상 페이지 접근성 트리 캡처기. DB 에 접근하지 않는다.
 *
 * Testea(Vercel 서버리스)는 Playwright 를 못 돌리므로, 코드 생성 LLM 에 넣을
 * 실시간 접근성 스냅샷 캡처를 러너가 대신한다. PoC 교훈 그대로:
 * - `page.locator('main').ariaSnapshot()` 가 코드 생성 셀렉터 정확도의 핵심 입력.
 * - main 이 없으면 body 로 fallback.
 * - storageState 로 인증 상태를 주입(있으면)해 보호된 페이지도 캡처.
 * - 로딩 스켈레톤(데이터 로딩 중 헤더 미렌더) 대비 networkidle 대기 + 넉넉한 타임아웃.
 */

export interface CaptureInput {
  /** 캡처 대상 절대 URL. */
  url: string;
  /**
   * 브라우저 컨텍스트에 주입할 storageState (쿠키/오리진). Testea 가 대상 인증으로
   * 구성해 전달한다. 러너는 복호화/인증 구성을 하지 않는다.
   */
  storageState?: unknown;
  /** 전체 캡처 하드 타임아웃 (ms). 기본 30s. */
  timeoutMs?: number;
}

export interface CaptureResult {
  /** 캡처 성공 여부. */
  ok: boolean;
  /** 성공 시 main(또는 body) 의 aria 스냅샷 문자열. */
  snapshot?: string;
  /** 실패 시 에러 메시지. */
  errorMessage?: string;
}

const DEFAULT_TIMEOUT_MS = 30_000;

export async function capture(input: CaptureInput): Promise<CaptureResult> {
  const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  const browser = await chromium.launch();
  try {
    const context = await browser.newContext(
      // storageState 는 Playwright 가 받는 형태({cookies, origins})를 그대로 전달.
      // 잘못된 형태면 newContext 가 던지므로 호출부에서 try/catch 로 흡수된다.
      input.storageState ? { storageState: input.storageState as never } : undefined
    );
    const page = await context.newPage();

    await page.goto(input.url, { waitUntil: 'domcontentloaded', timeout: timeoutMs });

    // 데이터 로딩(스켈레톤) 후 본문이 채워질 때까지 대기. networkidle 실패는 치명적이지
    // 않으므로(SPA 폴링 등) 흡수하고 캡처를 진행한다.
    await page.waitForLoadState('networkidle', { timeout: timeoutMs }).catch(() => {});

    const main = page.locator('main');
    const target = (await main.count()) > 0 ? main.first() : page.locator('body');

    const snapshot = await target.ariaSnapshot({ timeout: timeoutMs });

    return { ok: true, snapshot };
  } catch (error) {
    return {
      ok: false,
      errorMessage: error instanceof Error ? error.message : String(error),
    };
  } finally {
    await browser.close().catch(() => {});
  }
}
