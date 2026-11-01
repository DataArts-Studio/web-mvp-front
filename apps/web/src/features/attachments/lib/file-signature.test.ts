import { describe, expect, it } from 'vitest';

import { matchesFileSignature } from './file-signature';

const bytes = (...values: number[]) => new Uint8Array(values);
const text = (value: string) => new TextEncoder().encode(value);

const PNG = bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00);
const JPEG = bytes(0xff, 0xd8, 0xff, 0xe0);
const WEBP = text('RIFF\u0000\u0000\u0000\u0000WEBPVP8 ');
const utf16le = (value: string) => [...value].flatMap((char) => [char.charCodeAt(0), 0x00]);

const DOCX_TYPE = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const DOC_TYPE = 'application/msword';
const XLS_TYPE = 'application/vnd.ms-excel';

/** 리틀 엔디언으로 정수를 써 넣는 바이트 버퍼. */
class ByteWriter {
  private readonly parts: number[] = [];

  get length() {
    return this.parts.length;
  }

  u16(value: number) {
    this.parts.push(value & 0xff, (value >>> 8) & 0xff);
    return this;
  }

  u32(value: number) {
    this.u16(value & 0xffff).u16((value >>> 16) & 0xffff);
    return this;
  }

  raw(values: ArrayLike<number>) {
    this.parts.push(...Array.from(values));
    return this;
  }

  toBytes() {
    return new Uint8Array(this.parts);
  }
}

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/** 압축 없이(stored) 로컬 헤더 + 중앙 디렉터리 + EOCD 를 갖춘 최소 ZIP 을 만든다. */
function buildZip(entries: Record<string, string>): Uint8Array {
  const body = new ByteWriter();
  const directory = new ByteWriter();
  for (const [name, content] of Object.entries(entries)) {
    const nameBytes = text(name);
    const data = text(content);
    const crc = crc32(data);
    const localOffset = body.length;
    body
      .u32(0x04034b50)
      .u16(20)
      .u16(0)
      .u16(0)
      .u16(0)
      .u16(0)
      .u32(crc)
      .u32(data.length)
      .u32(data.length)
      .u16(nameBytes.length)
      .u16(0)
      .raw(nameBytes)
      .raw(data);
    directory
      .u32(0x02014b50)
      .u16(20)
      .u16(20)
      .u16(0)
      .u16(0)
      .u16(0)
      .u16(0)
      .u32(crc)
      .u32(data.length)
      .u32(data.length)
      .u16(nameBytes.length)
      .u16(0)
      .u16(0)
      .u16(0)
      .u16(0)
      .u32(0)
      .u32(localOffset)
      .raw(nameBytes);
  }
  const count = Object.keys(entries).length;
  const directoryOffset = body.length;
  return body
    .raw(directory.toBytes())
    .u32(0x06054b50)
    .u16(0)
    .u16(0)
    .u16(count)
    .u16(count)
    .u32(directory.length)
    .u32(directoryOffset)
    .u16(0)
    .toBytes();
}

const CFB_SECTOR = 512;
const CFB_FREE = 0xffffffff;
const CFB_END = 0xfffffffe;
const CFB_FAT_SECTOR = 0xfffffffd;

/**
 * 512 바이트 섹터의 최소 OLE(CFB) 파일을 만든다.
 * 헤더, FAT 1 섹터(0번), 디렉터리 1 섹터(1번, 루트 + 스트림 하나), 스트림 데이터 1 섹터(2번).
 */
function buildCfb(
  streamName: string,
  content: number[] = [],
  { directoryNext = CFB_END }: { directoryNext?: number } = {}
): Uint8Array {
  const header = new ByteWriter()
    .raw([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])
    .raw(new Array(16).fill(0))
    .u16(0x003e)
    .u16(3)
    .u16(0xfffe)
    .u16(9)
    .u16(6)
    .raw(new Array(6).fill(0))
    .u32(0)
    .u32(1) // FAT 섹터 수
    .u32(1) // 첫 디렉터리 섹터
    .u32(0)
    .u32(0x1000)
    .u32(CFB_END)
    .u32(0)
    .u32(CFB_END)
    .u32(0)
    .u32(0); // DIFAT[0] = FAT 은 0번 섹터
  for (let index = 1; index < 109; index++) header.u32(CFB_FREE);

  const fat = new ByteWriter().u32(CFB_FAT_SECTOR).u32(directoryNext).u32(CFB_END);
  while (fat.length < CFB_SECTOR) fat.u32(CFB_FREE);

  const directory = new ByteWriter();
  const entry = (name: string, type: number, start: number, size: number) => {
    const nameBytes = utf16le(name);
    directory
      .raw(nameBytes)
      .raw(new Array(64 - nameBytes.length).fill(0))
      .u16(nameBytes.length + 2)
      .raw([type, 1])
      .u32(CFB_FREE)
      .u32(CFB_FREE)
      .u32(type === 5 ? 1 : CFB_FREE)
      .raw(new Array(16 + 4 + 16).fill(0))
      .u32(start)
      .u32(size)
      .u32(0);
  };
  entry('Root Entry', 5, CFB_END, 0);
  entry(streamName, 2, 2, content.length);
  while (directory.length < CFB_SECTOR) directory.raw(new Array(128).fill(0));

  const data = new ByteWriter().raw(content);
  while (data.length < CFB_SECTOR) data.raw([0]);

  return header.raw(fat.toBytes()).raw(directory.toBytes()).raw(data.toBytes()).toBytes();
}

/**
 * FAT 섹터가 헤더 DIFAT 109 칸을 넘는 큰 CFB(약 7MB 넘는 .doc/.xls 에 해당).
 * 섹터 0~109 는 FAT, 110 은 추가 DIFAT, 111 은 디렉터리, 112 는 데이터다.
 */
function buildCfbWithExtraDifat(streamName: string, { difatNext = CFB_END } = {}): Uint8Array {
  const FAT_SECTORS = 110;
  const DIFAT = FAT_SECTORS;
  const DIRECTORY = DIFAT + 1;
  const DATA = DIRECTORY + 1;
  const bytes = new Uint8Array(CFB_SECTOR * (DATA + 2));
  const view = new DataView(bytes.buffer);
  bytes.set([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
  view.setUint16(0x18, 0x003e, true);
  view.setUint16(0x1a, 3, true);
  view.setUint16(0x1c, 0xfffe, true);
  view.setUint16(0x1e, 9, true);
  view.setUint16(0x20, 6, true);
  view.setUint32(0x2c, FAT_SECTORS, true);
  view.setUint32(0x30, DIRECTORY, true);
  view.setUint32(0x38, 0x1000, true);
  view.setUint32(0x3c, CFB_END, true);
  view.setUint32(0x44, DIFAT, true);
  view.setUint32(0x48, 1, true);
  for (let index = 0; index < 109; index++) view.setUint32(0x4c + index * 4, index, true);

  const sector = (sid: number) => CFB_SECTOR * (sid + 1);
  // FAT 전체를 빈 칸으로 채우고 필요한 섹터만 표시한다.
  for (let sid = 0; sid < FAT_SECTORS; sid++) {
    for (let offset = 0; offset < CFB_SECTOR; offset += 4) {
      view.setUint32(sector(sid) + offset, CFB_FREE, true);
    }
  }
  const setFat = (sid: number, value: number) => view.setUint32(sector(0) + sid * 4, value, true);
  for (let sid = 0; sid < FAT_SECTORS; sid++) setFat(sid, CFB_FAT_SECTOR);
  setFat(DIFAT, 0xfffffffc);
  setFat(DIRECTORY, CFB_END);
  setFat(DATA, CFB_END);

  // 추가 DIFAT 섹터: 110번째 FAT(섹터 109)를 가리키고, 마지막 칸은 다음 DIFAT 섹터.
  for (let offset = 0; offset < CFB_SECTOR; offset += 4) {
    view.setUint32(sector(DIFAT) + offset, CFB_FREE, true);
  }
  view.setUint32(sector(DIFAT), FAT_SECTORS - 1, true);
  view.setUint32(sector(DIFAT) + CFB_SECTOR - 4, difatNext, true);

  const writeEntry = (index: number, name: string, type: number) => {
    const base = sector(DIRECTORY) + index * 128;
    const nameBytes = utf16le(name);
    bytes.set(nameBytes, base);
    view.setUint16(base + 64, nameBytes.length + 2, true);
    view.setUint8(base + 66, type);
    view.setUint32(base + 68, CFB_FREE, true);
    view.setUint32(base + 72, CFB_FREE, true);
    view.setUint32(base + 76, type === 5 ? 1 : CFB_FREE, true);
    view.setUint32(base + 116, type === 5 ? CFB_END : DATA, true);
  };
  writeEntry(0, 'Root Entry', 5);
  writeEntry(1, streamName, 2);
  return bytes;
}

const DOCX = buildZip({
  '[Content_Types].xml': '<Types/>',
  'word/document.xml': '<w:document/>',
});
const XLSX = buildZip({
  '[Content_Types].xml': '<Types/>',
  'xl/workbook.xml': '<workbook/>',
});
const PLAIN_ZIP = buildZip({ 'a.txt': 'hello', 'b.txt': 'world' });
// 항목 이름이 아니라 파일 내용에만 `word/`·`xl/`·`[Content_Types].xml` 이 든 일반 ZIP.
const MARKER_IN_CONTENT_ZIP = buildZip({
  'a.txt': '[Content_Types].xml word/document.xml xl/workbook.xml',
});
const DOC = buildCfb('WordDocument');
const XLS = buildCfb('Workbook');
const OLD_XLS = buildCfb('Book');
// 디렉터리에는 `Data` 스트림뿐이고, 데이터 영역에만 UTF-16LE `WordDocument` 가 든 OLE.
const MARKER_IN_DATA_OLE = buildCfb('Data', utf16le('WordDocument'));
// 디렉터리 섹터 체인이 자기 자신을 가리켜 순환하는 OLE.
const LOOPING_OLE = buildCfb('WordDocument', [], { directoryNext: 1 });

describe('matchesFileSignature', () => {
  it.each([
    ['image/png', PNG],
    ['image/jpeg', JPEG],
    ['image/gif', text('GIF89a')],
    ['image/webp', WEBP],
    ['application/pdf', text('%PDF-1.7')],
    [DOC_TYPE, DOC],
    [XLS_TYPE, XLS],
    [XLS_TYPE, OLD_XLS],
    [DOCX_TYPE, DOCX],
    [XLSX_TYPE, XLSX],
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
    ['일반 ZIP 을 xlsx 로 속인 파일', XLSX_TYPE, PLAIN_ZIP],
    ['일반 ZIP 을 docx 로 속인 파일', DOCX_TYPE, PLAIN_ZIP],
    ['내용에만 xl/ 이 든 ZIP 을 xlsx 로 속인 파일', XLSX_TYPE, MARKER_IN_CONTENT_ZIP],
    ['내용에만 word/ 가 든 ZIP 을 docx 로 속인 파일', DOCX_TYPE, MARKER_IN_CONTENT_ZIP],
    ['docx 를 xlsx 로 속인 파일', XLSX_TYPE, DOCX],
    ['xlsx 를 docx 로 속인 파일', DOCX_TYPE, XLSX],
    ['EOCD 가 잘린 docx', DOCX_TYPE, DOCX.subarray(0, DOCX.length - 10)],
    ['ZIP 헤더 뒤가 쓰레기인 파일', DOCX_TYPE, bytes(0x50, 0x4b, 0x03, 0x04, 0x14, 0x00)],
    ['데이터에만 WordDocument 가 든 OLE 를 doc 로 속인 파일', DOC_TYPE, MARKER_IN_DATA_OLE],
    ['xls 를 doc 로 속인 파일', DOC_TYPE, XLS],
    ['doc 를 xls 로 속인 파일', XLS_TYPE, DOC],
    ['디렉터리 섹터가 잘린 doc', DOC_TYPE, DOC.subarray(0, CFB_SECTOR * 2 + 100)],
    ['디렉터리 체인이 순환하는 OLE', DOC_TYPE, LOOPING_OLE],
    [
      'OLE 헤더 뒤가 쓰레기인 파일',
      DOC_TYPE,
      bytes(0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0x00),
    ],
    ['허용하지 않는 SVG', 'image/svg+xml', text('<svg xmlns="http://www.w3.org/2000/svg"/>')],
  ])('%s 은 거부한다', (_label, type, data) => {
    expect(matchesFileSignature(type, data)).toBe(false);
  });

  it.each(['constructor', '__proto__', 'toString', 'hasOwnProperty'])(
    '%s 같은 프로토타입 속성 이름은 예외 없이 거부한다',
    (type) => {
      expect(() => matchesFileSignature(type, PNG)).not.toThrow();
      expect(matchesFileSignature(type, PNG)).toBe(false);
    }
  );

  it('FAT 이 헤더 DIFAT 109 칸을 넘는 큰 doc 은 추가 DIFAT 체인을 따라가 통과시킨다', () => {
    expect(matchesFileSignature('application/msword', buildCfbWithExtraDifat('WordDocument'))).toBe(
      true
    );
    expect(
      matchesFileSignature('application/vnd.ms-excel', buildCfbWithExtraDifat('Workbook'))
    ).toBe(true);
  });

  it('추가 DIFAT 체인이 끊기거나 FAT 수가 파일 크기를 넘으면 거부한다', () => {
    expect(
      matchesFileSignature(
        'application/msword',
        buildCfbWithExtraDifat('WordDocument', { difatNext: 110 })
      )
    ).toBe(true); // 이미 필요한 FAT 를 다 모았으면 다음 칸은 읽지 않는다
    const broken = buildCfbWithExtraDifat('WordDocument');
    new DataView(broken.buffer).setUint32(0x44, CFB_END, true);
    expect(matchesFileSignature('application/msword', broken)).toBe(false);
    const oversized = buildCfbWithExtraDifat('WordDocument');
    new DataView(oversized.buffer).setUint32(0x2c, 300, true); // 파일에 들어갈 수 없는 FAT 수
    expect(matchesFileSignature('application/msword', oversized)).toBe(false);
  });
});
