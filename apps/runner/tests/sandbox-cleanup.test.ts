import assert from 'node:assert/strict';
import childProcess from 'node:child_process';
import fs from 'node:fs/promises';
import { after, test } from 'node:test';

// Linux root 조건만 모의한다. 종료 헬퍼와 /proc 접근은 매 테스트에서 모두 대체한다.
const platform = Object.getOwnPropertyDescriptor(process, 'platform')!;
const getuid = Object.getOwnPropertyDescriptor(process, 'getuid');
const sandboxUid = process.env.RUNNER_SANDBOX_UID;
const sandboxGid = process.env.RUNNER_SANDBOX_GID;
process.env.RUNNER_SANDBOX_UID = '1000';
process.env.RUNNER_SANDBOX_GID = '1000';
Object.defineProperty(process, 'platform', { configurable: true, value: 'linux' });
Object.defineProperty(process, 'getuid', { configurable: true, value: () => 0 });
after(() => {
  if (sandboxUid === undefined) delete process.env.RUNNER_SANDBOX_UID;
  else process.env.RUNNER_SANDBOX_UID = sandboxUid;
  if (sandboxGid === undefined) delete process.env.RUNNER_SANDBOX_GID;
  else process.env.RUNNER_SANDBOX_GID = sandboxGid;
  Object.defineProperty(process, 'platform', platform);
  if (getuid) Object.defineProperty(process, 'getuid', getuid);
  else Reflect.deleteProperty(process, 'getuid');
});

const failure = (code: string) => Object.assign(new Error('synthetic failure'), { code });
const status = (uid: number, state = 'S') =>
  `State:\t${state} (test)\nUid:\t${uid}\t${uid}\t${uid}\t${uid}\n`;
const scenarios = [
  { name: '빈 프로세스 목록을 정상으로 처리한다.', entries: [], expected: true },
  {
    name: '다른 UID와 좀비를 정리 완료로 처리한다.',
    entries: ['1', '2'],
    statuses: [status(0), status(1000, 'Z')],
    expected: true,
  },
  { name: '조회 사이에 사라진 PID를 허용한다.', error: 'ENOENT', expected: true },
  { name: '사라진 프로세스의 ESRCH를 허용한다.', error: 'ESRCH', expected: true },
  {
    name: 'proc 목록 조회 실패 시 후속 실행을 차단한다.',
    directoryError: 'EACCES',
    expected: false,
  },
  { name: '프로세스 상태의 권한 오류 시 후속 실행을 차단한다.', error: 'EACCES', expected: false },
  { name: '프로세스 상태의 I/O 오류 시 후속 실행을 차단한다.', error: 'EIO', expected: false },
  { name: 'UID가 없는 상태를 거부한다.', statuses: ['State:\tS (test)\n'], expected: false },
  { name: '상태가 없는 응답을 거부한다.', statuses: ['Uid:\t0\t0\t0\t0\n'], expected: false },
  {
    name: '잘못된 UID를 거부한다.',
    statuses: ['State:\tS (test)\nUid:\t0\twrong\t0\t0\n'],
    expected: false,
  },
  { name: '살아남은 sandbox UID를 거부한다.', statuses: [status(1000)], expected: false },
  { name: '종료 헬퍼 실행 실패를 거부한다.', helperError: true, expected: false },
  { name: '종료 헬퍼 비정상 종료를 거부한다.', helperStatus: 1, expected: false },
];

for (const [index, scenario] of scenarios.entries()) {
  test(scenario.name, async (t) => {
    const helper = t.mock.method(childProcess, 'spawnSync', () => ({
      status: scenario.helperStatus ?? 0,
      error: scenario.helperError ? failure('EPERM') : undefined,
    }));
    t.mock.method(fs, 'readdir', async () => {
      if (scenario.directoryError) throw failure(scenario.directoryError);
      return scenario.entries ?? ['1'];
    });
    let readIndex = 0;
    t.mock.method(fs, 'readFile', async () => {
      if (scenario.error) throw failure(scenario.error);
      const statuses = scenario.statuses ?? [status(0)];
      return statuses[readIndex++ % statuses.length];
    });
    t.mock.method(console, 'error', () => {});
    const sandbox = await import(`../src/sandbox.ts?case=${index}`);
    assert.equal(sandbox.sandboxCompromised(), false);
    assert.equal(await sandbox.killSandboxProcesses(), scenario.expected);
    assert.equal(sandbox.sandboxCompromised(), !scenario.expected);
    if (!scenario.expected) {
      const calls = helper.mock.callCount();
      assert.equal(await sandbox.killSandboxProcesses(), false);
      assert.equal(helper.mock.callCount(), calls);
      assert.equal(sandbox.sandboxCompromised(), true);
    }
  });
}
