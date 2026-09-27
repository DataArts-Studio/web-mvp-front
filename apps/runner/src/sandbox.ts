import { spawnSync } from 'node:child_process';
import { chown, readFile, readdir } from 'node:fs/promises';

/**
 * 비신뢰 spec 실행 격리 경계.
 *
 * 서버(root)와 spec(비특권 uid)을 서로 다른 uid 로 분리한다. 같은 uid 로 돌면 spec 이
 * /proc/<서버 pid>/environ 에서 RUNNER_SHARED_SECRET 을 읽거나 서버 코드·의존성을 변조할 수
 * 있다. uid 전환(setuid)은 root 만 가능하므로 서버는 root 로 뜨고 spec 자식만 강등한다.
 *
 * - 앱 파일(/app/dist, node_modules)은 root 소유라 spec uid 는 읽기만 가능하다.
 * - 요청별 run 디렉터리만 spec uid 에 넘긴다.
 * - run 이 끝나면 spec uid 의 잔여 프로세스를 전부 종료해, setsid 로 프로세스 그룹을
 *   빠져나간 백그라운드 프로세스가 다음 run 을 엿보지 못하게 한다.
 */

/** 양의 정수(비root)만 허용한다. 0(root)·음수·NaN·빈 문자열은 무효로 본다. */
function parseSandboxId(raw: string | undefined, fallback: number): number {
  if (raw === undefined) return fallback;
  const value = Number(raw);
  return raw.trim() !== '' && Number.isSafeInteger(value) && value > 0 ? value : Number.NaN;
}

/** Playwright 베이스 이미지의 비특권 사용자 pwuser (uid/gid 1000). */
export const SANDBOX_UID = parseSandboxId(process.env.RUNNER_SANDBOX_UID, 1000);
export const SANDBOX_GID = parseSandboxId(process.env.RUNNER_SANDBOX_GID, 1000);

/** 정리 후에도 spec uid 프로세스가 남았는지. 한 번 true 가 되면 이 인스턴스는 더 실행하지 않는다. */
let compromised = false;

export function sandboxCompromised(): boolean {
  return compromised;
}

/**
 * uid 분리 격리를 쓸 수 있는지. root 로 떠 있는 Linux 이고 sandbox uid/gid 가 유효한
 * 비root 값일 때만 true. (Windows/macOS 로컬 개발, 비root 실행, 잘못된 uid 설정은 false.)
 */
export function isolationAvailable(): boolean {
  return (
    process.platform === 'linux' &&
    process.getuid?.() === 0 &&
    !Number.isNaN(SANDBOX_UID) &&
    !Number.isNaN(SANDBOX_GID)
  );
}

/**
 * 격리 없이 실행을 허용할지. 로컬 개발 편의용 명시적 opt-in 이며 운영에서는 켜지 않는다.
 * 기본은 fail-closed: 격리를 못 쓰면 /run 을 거부한다.
 */
export function unisolatedRunAllowed(): boolean {
  return process.env.RUNNER_ALLOW_UNISOLATED === '1';
}

/** run 디렉터리와 그 안의 입력 파일을 spec uid 소유로 넘긴다. */
export async function handOverToSandbox(paths: string[]): Promise<void> {
  if (!isolationAvailable()) return;
  for (const path of paths) {
    await chown(path, SANDBOX_UID, SANDBOX_GID);
  }
}

/** /proc 에서 spec uid 로 살아 있는(좀비 제외) 프로세스 pid 를 모은다. */
async function listLiveSandboxPids(): Promise<number[]> {
  let entries: string[];
  try {
    entries = await readdir('/proc');
  } catch {
    return [];
  }
  const pids: number[] = [];
  for (const entry of entries) {
    if (!/^\d+$/.test(entry)) continue;
    try {
      const status = await readFile(`/proc/${entry}/status`, 'utf8');
      const lines = status.split('\n');
      // State: Z (zombie) 는 이미 죽어 거둬지기만 기다리는 상태라 제외한다.
      if (lines.find((line) => line.startsWith('State:'))?.includes('Z')) continue;
      // Uid: real effective saved fs. 어느 하나라도 sandbox uid 면 대상이다.
      const uidLine = lines.find((line) => line.startsWith('Uid:'));
      const uids = uidLine?.split(/\s+/).slice(1).map(Number) ?? [];
      if (uids.includes(SANDBOX_UID)) pids.push(Number(entry));
    } catch {
      // 조회 사이에 종료된 프로세스(ENOENT)는 무시한다.
    }
  }
  return pids;
}

const KILL_ATTEMPTS = 5;
const KILL_RETRY_DELAY_MS = 100;

/**
 * spec uid 로 도는 프로세스를 전부 종료하고, 남은 것이 없음을 확인한다.
 *
 * /proc 을 한 번 훑어 pid 별로 죽이면 훑은 직후 fork 된 프로세스를 놓친다. 대신 spec uid 로
 * 강등한 헬퍼가 kill(-1, SIGKILL) 을 호출해, 커널이 그 uid 의 모든 프로세스에 한 번에
 * 신호를 보내게 한다. SIGKILL 이 걸린 프로세스는 fork 를 완료할 수 없어 이 경쟁에서 빠져나갈
 * 수 없다. 이후 /proc 으로 잔여가 없음을 확인하고, 끝내 남으면 이 인스턴스를 오염 상태로
 * 표시해 이후 실행을 거부한다(fail-closed).
 *
 * @returns 잔여 프로세스가 없으면 true.
 */
export async function killSandboxProcesses(): Promise<boolean> {
  if (!isolationAvailable()) return true;
  for (let attempt = 0; attempt < KILL_ATTEMPTS; attempt += 1) {
    // 헬퍼 자신은 kill(-1) 대상에서 제외된다(Linux). 헬퍼가 끝나면 spec uid 프로세스는 없어야 한다.
    spawnSync(process.execPath, ['-e', "try { process.kill(-1, 'SIGKILL'); } catch {}"], {
      uid: SANDBOX_UID,
      gid: SANDBOX_GID,
      env: {},
      stdio: 'ignore',
      timeout: 5_000,
    });
    if ((await listLiveSandboxPids()).length === 0) return true;
    await new Promise((resolve) => setTimeout(resolve, KILL_RETRY_DELAY_MS));
  }
  compromised = true;
  console.error('[runner] sandbox processes survived cleanup. Refusing further runs.');
  return false;
}
