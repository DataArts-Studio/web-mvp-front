import { readFile, writeFile } from 'node:fs/promises';

import { capture } from './capture.js';

/**
 * sandbox uid 로 강등된 자식 프로세스에서 캡처를 실행하는 진입점.
 * 입력·결과는 요청별 run 디렉터리의 파일로만 주고받는다 (capture-sandbox.ts).
 */
const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) process.exit(2);

const input = JSON.parse(await readFile(inputPath, 'utf8'));
const result = await capture(input);
await writeFile(outputPath, JSON.stringify(result), { encoding: 'utf8', mode: 0o600 });
