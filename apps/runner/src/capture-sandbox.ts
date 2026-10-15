import { spawn } from 'node:child_process';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { type CaptureInput, type CaptureResult, capture } from './capture.js';
import { buildChildEnv, prepareRunDir } from './run-spec.js';
import {
  SANDBOX_GID,
  SANDBOX_UID,
  cleanupSandbox,
  handOverToSandbox,
  isolationAvailable,
} from './sandbox.js';

/**
 * 캡처를 spec 과 같은 sandbox uid 로 실행한다.
 *
 * 캡처는 외부 페이지를 Chromium 으로 연다. root 로 열면 브라우저가 침해됐을 때 서버
 * 시크릿과 다른 요청의 storageState 까지 닿고, sandbox uid 에만 걸린 나가는 연결 차단
 * (egress-filter.ts)도 받지 않는다. 그래서 spec 과 같은 경계 안에서 돌린다.
 *
 * 격리를 쓸 수 없는 환경(로컬 개발)에서는 기존처럼 프로세스 안에서 실행한다.
 */

const DEFAULT_TIMEOUT_MS = 30_000;
const WORKER_PATH = join(dirname(fileURLToPath(import.meta.url)), 'capture-worker.js');

export async function captureInSandbox(input: CaptureInput): Promise<CaptureResult> {
  if (!isolationAvailable()) return capture(input);

  const timeoutMs = input.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const dir = await prepareRunDir();
  try {
    const inputPath = join(dir, 'capture-input.json');
    const outputPath = join(dir, 'capture-output.json');
    // storageState 를 담으므로 소유자 전용으로 쓴다.
    await writeFile(inputPath, JSON.stringify(input), { encoding: 'utf8', mode: 0o600 });
    await handOverToSandbox([dir, inputPath]);

    await new Promise<void>((resolve) => {
      const child = spawn(process.execPath, [WORKER_PATH, inputPath, outputPath], {
        cwd: dir,
        stdio: 'ignore',
        env: buildChildEnv(dir),
        detached: true,
        uid: SANDBOX_UID,
        gid: SANDBOX_GID,
      });
      const killGroup = () => {
        if (child.pid === undefined) return;
        try {
          process.kill(-child.pid, 'SIGKILL');
        } catch {
          // 이미 종료됐으면 무시한다.
        }
      };
      // goto·networkidle·ariaSnapshot 이 각각 timeoutMs 를 쓰므로 전체 상한은 그 합에 여유를 둔다.
      const killer = setTimeout(killGroup, timeoutMs * 3 + 10_000);
      child.on('error', () => {
        clearTimeout(killer);
        resolve();
      });
      child.on('close', () => {
        clearTimeout(killer);
        resolve();
      });
    });

    try {
      return JSON.parse(await readFile(outputPath, 'utf8')) as CaptureResult;
    } catch {
      return { ok: false, errorMessage: 'Capture produced no result (timed out or crashed).' };
    }
  } finally {
    await cleanupSandbox().catch(() => {});
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
