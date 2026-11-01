import { describe, expect, it } from 'vitest';

import { matchesFileSignature } from './file-signature';

const bytes = (...values: number[]) => new Uint8Array(values);
const text = (value: string) => new TextEncoder().encode(value);

const PNG = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00);
const JPEG = bytes(0xff, 0xd8, 0xff, 0xe0);
const WEBP = text('RIFF\u0000\u0000\u0000\u0000WEBPVP8 ');
const ZIP = bytes(0x50, 0x4b, 0x03, 0x04, 0x14);
const OLE = bytes(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1);

describe('matchesFileSignature', () => {
  it.each([
    ['image/png', PNG],
    ['image/jpeg', JPEG],
    ['image/gif', text('GIF89a')],
    ['image/webp', WEBP],
    ['application/pdf', text('%PDF-1.7')],
    ['application/msword', OLE],
    ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ZIP],
    ['text/plain', text('hello')],
    ['text/csv', text('a,b\n1,2')],
  ])('%s 시그니처가 맞으면 통과한다', (type, data) => {
    expect(matchesFileSignature(type, data)).toBe(true);
  });

  it.each([
    ['HTML 을 PNG 로 속인 파일', 'image/png', text('<html><script>alert(1)</script>')],
    ['PNG 를 JPEG 로 속인 파일', 'image/jpeg', PNG],
    ['RIFF 이지만 WEBP 가 아닌 파일', 'image/webp', text('RIFF\u0000\u0000\u0000\u0000AVI ')],
    ['헤더보다 짧은 파일', 'image/png', bytes(0x89, 0x50)],
    ['NUL 바이트가 든 텍스트', 'text/plain', bytes(0x68, 0x00, 0x69)],
    ['허용하지 않는 SVG', 'image/svg+xml', text('<svg xmlns="http://www.w3.org/2000/svg"/>')],
  ])('%s 은 거부한다', (_label, type, data) => {
    expect(matchesFileSignature(type, data)).toBe(false);
  });
});
