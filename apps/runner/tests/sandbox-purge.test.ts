import assert from 'node:assert/strict';
import childProcess from 'node:child_process';
import fs from 'node:fs/promises';
import { after, test } from 'node:test';

// Linux root 조건만 모의한다. 프로세스 정리는 성공으로 두고 공유 경로 정리만 본다.
const platform = Object.getOwnPropertyDescriptor(process, 'platform')!;
const getuid = Object.getOwnPropertyDescriptor(process, 'getuid');
Object.defineProperty(process, 'platform', { configurable: true, value: 'linux' });
Object.defineProperty(process, 'getuid', { configurable: true, value: () => 0 });
after(() => {
  Object.defineProperty(process, 'platform', platform);
  if (getuid) Object.defineProperty(process, 'getuid', getuid);
  else Reflect.deleteProperty(process, 'getuid');
});

type Entry = { uid: number; children?: Record<string, Entry> };

function mockFs(t: import('node:test').TestContext, tree: Record<string, Entry>, rmError?: string) {
  t.mock.method(childProcess, 'spawnSync', () => ({ status: 0 }));
  const lookup = (path: string): Entry | undefined => {
    const parts = path.split('/').filter(Boolean);
    let node: Entry | undefined = { uid: 0, children: tree };
    for (const part of parts) node = node?.children?.[part];
    return node;
  };
  t.mock.method(fs, 'readdir', async (path: string) => {
    if (path === '/proc') return [];
    const node = lookup(path);
    if (!node?.children) throw Object.assign(new Error('missing'), { code: 'ENOENT' });
    return Object.keys(node.children);
  });
  t.mock.method(fs, 'lstat', async (path: string) => {
    const node = lookup(path)!;
    return { uid: node.uid, isDirectory: () => !!node.children };
  });
  const removed: string[] = [];
  t.mock.method(fs, 'rm', async (path: string) => {
    if (rmError) throw Object.assign(new Error('rm failed'), { code: rmError });
    removed.push(path);
  });
  t.mock.method(console, 'error', () => {});
  return removed;
}

let caseIndex = 0;
const load = () => import(`../src/sandbox.ts?purge=${caseIndex++}`);

test('공유 경로의 sandbox uid 소유 항목만 지운다 (root 디렉터리 안쪽 포함).', async (t) => {
  const removed = mockFs(t, {
    tmp: {
      uid: 0,
      children: {
        'planted-chromium': { uid: 1000 },
        'root-file': { uid: 0 },
        '.X11-unix': { uid: 0, children: { sock: { uid: 1000 }, keep: { uid: 0 } } },
      },
    },
    dev: { uid: 0, children: { shm: { uid: 0, children: { leftover: { uid: 1000 } } } } },
  });
  const sandbox = await load();
  assert.equal(await sandbox.cleanupSandbox(), true);
  assert.deepEqual(removed.sort(), [
    '/dev/shm/leftover',
    '/tmp/.X11-unix/sock',
    '/tmp/planted-chromium',
  ]);
  assert.equal(sandbox.sandboxCompromised(), false);
});

test('지우지 못하면 인스턴스를 오염 상태로 두고 이후 실행을 거부한다.', async (t) => {
  mockFs(t, { tmp: { uid: 0, children: { planted: { uid: 1000 } } } }, 'EPERM');
  const sandbox = await load();
  assert.equal(await sandbox.cleanupSandbox(), false);
  assert.equal(sandbox.sandboxCompromised(), true);
});
