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

/** Playwright 베이스 이미지의 비특권 사용자 pwuser (uid/gid 1000). */
export const SANDBOX_UID = Number(process.env.RUNNER_SANDBOX_UID ?? 1000);
export const SANDBOX_GID = Number(process.env.RUNNER_SANDBOX_GID ?? 1000);

/**
 * uid 분리 격리를 쓸 수 있는지. root 로 떠 있는 Linux 에서만 true.
 * (Windows/macOS 로컬 개발이나 비root 실행에서는 false.)
 */
export function isolationAvailable(): boolean {
  return process.platform === 'linux' && process.getuid?.() === 0;
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

/**
 * spec uid 로 도는 프로세스를 전부 SIGKILL 한다. /proc 을 직접 훑어 외부 도구(pkill) 의존이 없다.
 * 한 번에 하나의 run 만 받는 전제라, 이 uid 의 프로세스는 모두 직전 run 의 잔여물이다.
 */
export async function killSandboxProcesses(): Promise<void> {
  if (!isolationAvailable()) return;
  let entries: string[];
  try {
    entries = await readdir('/proc');
  } catch {
    return;
  }
  for (const entry of entries) {
    if (!/^\d+$/.test(entry)) continue;
    const pid = Number(entry);
    try {
      const status = await readFile(`/proc/${pid}/status`, 'utf8');
      const uidLine = status.split('\n').find((line) => line.startsWith('Uid:'));
      // Uid: real effective saved fs. 어느 하나라도 sandbox uid 면 대상이다.
      const uids = uidLine?.split(/\s+/).slice(1).map(Number) ?? [];
      if (uids.includes(SANDBOX_UID)) {
        process.kill(pid, 'SIGKILL');
      }
    } catch {
      // 조회 사이에 종료된 프로세스(ENOENT/ESRCH)는 무시한다.
    }
  }
}
