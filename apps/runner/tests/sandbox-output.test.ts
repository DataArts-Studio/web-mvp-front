import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import { join } from 'node:path';
import { after, before, test } from 'node:test';

import { readSandboxOutput } from '../src/sandbox.js';

let dir: string;
before(async () => {
  dir = await fs.mkdtemp(join(os.tmpdir(), 'sandbox-output-'));
});
after(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

test('일반 파일은 내용을 그대로 읽는다.', async () => {
  const path = join(dir, 'report.json');
  await fs.writeFile(path, '{"ok":true}');
  assert.deepEqual(await readSandboxOutput(path), { status: 'ok', text: '{"ok":true}' });
});

test('없는 파일은 missing 을 돌려준다.', async () => {
  assert.deepEqual(await readSandboxOutput(join(dir, 'missing.json')), { status: 'missing' });
});

test('FIFO 로 바꿔치기한 파일은 블록되지 않고 거부한다.', async () => {
  const path = join(dir, 'fifo.json');
  execFileSync('mkfifo', [path]);
  assert.deepEqual(await readSandboxOutput(path), { status: 'missing' });
});

test('심볼릭 링크는 따라가지 않는다.', async () => {
  const path = join(dir, 'link.json');
  await fs.symlink('/dev/zero', path);
  assert.deepEqual(await readSandboxOutput(path), { status: 'missing' });
});

test('크기 상한을 넘는 파일은 too_large 로 구분한다.', async () => {
  const path = join(dir, 'big.json');
  await fs.writeFile(path, 'x'.repeat(33));
  assert.deepEqual(await readSandboxOutput(path, 32), { status: 'too_large' });
  assert.deepEqual(await readSandboxOutput(path, 33), { status: 'ok', text: 'x'.repeat(33) });
});
