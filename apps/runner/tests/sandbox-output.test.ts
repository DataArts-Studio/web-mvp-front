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
  assert.equal(await readSandboxOutput(path), '{"ok":true}');
});

test('없는 파일은 undefined 를 돌려준다.', async () => {
  assert.equal(await readSandboxOutput(join(dir, 'missing.json')), undefined);
});

test('FIFO 로 바꿔치기한 파일은 블록되지 않고 거부한다.', async () => {
  const path = join(dir, 'fifo.json');
  execFileSync('mkfifo', [path]);
  assert.equal(await readSandboxOutput(path), undefined);
});

test('심볼릭 링크는 따라가지 않는다.', async () => {
  const path = join(dir, 'link.json');
  await fs.symlink('/dev/zero', path);
  assert.equal(await readSandboxOutput(path), undefined);
});

test('크기 상한을 넘는 파일은 거부한다.', async () => {
  const path = join(dir, 'big.json');
  await fs.writeFile(path, 'x'.repeat(33));
  assert.equal(await readSandboxOutput(path, 32), undefined);
  assert.equal(await readSandboxOutput(path, 33), 'x'.repeat(33));
});
