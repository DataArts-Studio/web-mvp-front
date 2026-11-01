/**
 * 업로드 파일의 앞부분 바이트(매직 넘버)가 클라이언트가 주장한 MIME 타입과 맞는지 확인한다.
 *
 * `File.type` 은 브라우저·클라이언트가 정하는 값이라 그대로 믿으면 HTML·스크립트를 이미지로
 * 속여 저장할 수 있다. 서버에서 시그니처를 대조한 타입만 저장·서빙에 쓴다.
 */

/** 텍스트로 받는 파일에서 NUL 바이트를 찾아볼 앞부분 길이. */
const TEXT_SNIFF_BYTES = 8 * 1024;

type Signature = { offset: number; bytes: number[] };

const ascii = (text: string) => [...text].map((char) => char.charCodeAt(0));

const PNG: Signature[] = [{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }];
const JPEG: Signature[] = [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }];
const GIF: Signature[] = [{ offset: 0, bytes: ascii('GIF8') }];
const WEBP: Signature[] = [
  { offset: 0, bytes: ascii('RIFF') },
  { offset: 8, bytes: ascii('WEBP') },
];
const PDF: Signature[] = [{ offset: 0, bytes: ascii('%PDF-') }];
// 구형 Office(doc·xls) 는 OLE 복합 문서, 신형(docx·xlsx) 은 ZIP 컨테이너다.
const OLE: Signature[] = [{ offset: 0, bytes: [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1] }];
const ZIP: Signature[] = [{ offset: 0, bytes: [0x50, 0x4b, 0x03, 0x04] }];

const SIGNATURES: Record<string, Signature[]> = {
  'image/png': PNG,
  'image/jpeg': JPEG,
  'image/gif': GIF,
  'image/webp': WEBP,
  'application/pdf': PDF,
  'application/msword': OLE,
  'application/vnd.ms-excel': OLE,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ZIP,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ZIP,
};

const TEXT_TYPES = new Set(['text/plain', 'text/csv']);

function startsWith(bytes: Uint8Array, { offset, bytes: expected }: Signature): boolean {
  if (bytes.length < offset + expected.length) return false;
  return expected.every((byte, index) => bytes[offset + index] === byte);
}

/**
 * 같은 컨테이너(ZIP·OLE)를 쓰는 Office 형식은 컨테이너 안의 항목 목록으로 하위 형식을 구분한다.
 * 바이트 전체에서 `word/` 같은 문자열을 찾으면 파일 내용에 그 문자열만 넣어도 통과하므로,
 * ZIP 은 중앙 디렉터리, OLE 는 디렉터리 섹터를 실제로 따라가 항목 이름을 모은다.
 * 구조가 조금이라도 어긋나면 해당 형식이 아닌 것으로 본다.
 */

function dataViewOf(bytes: Uint8Array): DataView {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

const ZIP_EOCD_SIGNATURE = 0x06054b50;
const ZIP_CENTRAL_HEADER_SIGNATURE = 0x02014b50;
const ZIP_EOCD_SIZE = 22;
const ZIP_CENTRAL_HEADER_SIZE = 46;
/** EOCD 고정부(22) + 최대 주석 길이(65535). EOCD 는 파일 끝에서 이 범위 안에 있다. */
const ZIP_EOCD_SEARCH_BYTES = ZIP_EOCD_SIZE + 0xffff;

/** ZIP 중앙 디렉터리의 항목 이름 목록. 구조가 깨졌으면 null. */
function readZipEntryNames(bytes: Uint8Array): string[] | null {
  if (bytes.length < ZIP_EOCD_SIZE) return null;
  const view = dataViewOf(bytes);

  // EOCD 는 뒤에 가변 길이 주석이 붙을 수 있어 끝에서부터 거꾸로 찾는다.
  const searchStart = Math.max(0, bytes.length - ZIP_EOCD_SEARCH_BYTES);
  let eocd = -1;
  for (let offset = bytes.length - ZIP_EOCD_SIZE; offset >= searchStart; offset--) {
    if (view.getUint32(offset, true) !== ZIP_EOCD_SIGNATURE) continue;
    const commentLength = view.getUint16(offset + 20, true);
    if (offset + ZIP_EOCD_SIZE + commentLength <= bytes.length) {
      eocd = offset;
      break;
    }
  }
  if (eocd === -1) return null;

  const entryCount = view.getUint16(eocd + 10, true);
  const directorySize = view.getUint32(eocd + 12, true);
  const directoryOffset = view.getUint32(eocd + 16, true);
  const directoryEnd = directoryOffset + directorySize;
  if (directoryEnd > eocd) return null;

  const decoder = new TextDecoder();
  const names: string[] = [];
  let cursor = directoryOffset;
  for (let index = 0; index < entryCount; index++) {
    if (cursor + ZIP_CENTRAL_HEADER_SIZE > directoryEnd) return null;
    if (view.getUint32(cursor, true) !== ZIP_CENTRAL_HEADER_SIGNATURE) return null;
    const nameLength = view.getUint16(cursor + 28, true);
    const extraLength = view.getUint16(cursor + 30, true);
    const commentLength = view.getUint16(cursor + 32, true);
    const nameStart = cursor + ZIP_CENTRAL_HEADER_SIZE;
    const next = nameStart + nameLength + extraLength + commentLength;
    if (next > directoryEnd) return null;
    names.push(decoder.decode(bytes.subarray(nameStart, nameStart + nameLength)));
    cursor = next;
  }
  return names;
}

const CFB_HEADER_SIZE = 512;
const CFB_DIFAT_HEADER_OFFSET = 0x4c;
const CFB_DIFAT_HEADER_ENTRIES = 109;
const CFB_DIRECTORY_ENTRY_SIZE = 128;
const CFB_END_OF_CHAIN = 0xfffffffe;
const CFB_STREAM_OBJECT = 2;

/** OLE(CFB) 디렉터리에 있는 스트림 이름 목록. 구조가 깨졌으면 null. */
function readCfbStreamNames(bytes: Uint8Array): string[] | null {
  if (bytes.length < CFB_HEADER_SIZE) return null;
  const view = dataViewOf(bytes);

  // 섹터 크기는 v3 의 512 바이트(shift 9) 또는 v4 의 4096 바이트(shift 12) 뿐이다.
  const sectorShift = view.getUint16(0x1e, true);
  if (sectorShift !== 9 && sectorShift !== 12) return null;
  const sectorSize = 1 << sectorShift;
  const sectorOffset = (sid: number) => (sid + 1) * sectorSize;
  const hasSector = (sid: number) => sectorOffset(sid) + sectorSize <= bytes.length;

  // 헤더의 DIFAT 109 칸에 다 들어가지 않는 FAT(추가 DIFAT 섹터)는 첨부 크기 상한상 나올 수 없어 받지 않는다.
  const fatSectorCount = view.getUint32(0x2c, true);
  if (fatSectorCount === 0 || fatSectorCount > CFB_DIFAT_HEADER_ENTRIES) return null;

  const fat: number[] = [];
  for (let index = 0; index < fatSectorCount; index++) {
    const fatSector = view.getUint32(CFB_DIFAT_HEADER_OFFSET + index * 4, true);
    if (!hasSector(fatSector)) return null;
    const base = sectorOffset(fatSector);
    for (let offset = 0; offset < sectorSize; offset += 4) {
      fat.push(view.getUint32(base + offset, true));
    }
  }

  const decoder = new TextDecoder('utf-16le');
  const names: string[] = [];
  const visited = new Set<number>();
  let sid = view.getUint32(0x30, true);
  // 체인이 순환하지 않도록 같은 섹터를 두 번 밟으면 깨진 파일로 본다(FAT 길이가 최대 반복 수다).
  while (sid !== CFB_END_OF_CHAIN) {
    if (sid >= fat.length || visited.has(sid) || !hasSector(sid)) return null;
    visited.add(sid);
    const base = sectorOffset(sid);
    for (let entry = base; entry < base + sectorSize; entry += CFB_DIRECTORY_ENTRY_SIZE) {
      if (view.getUint8(entry + 66) !== CFB_STREAM_OBJECT) continue;
      // 이름 길이는 NUL 종료 문자를 포함한 바이트 수다.
      const nameLength = view.getUint16(entry + 64, true);
      if (nameLength < 2 || nameLength > 64 || nameLength % 2 !== 0) return null;
      names.push(decoder.decode(bytes.subarray(entry, entry + nameLength - 2)));
    }
    sid = fat[sid];
  }
  return names;
}

const isDocx = (bytes: Uint8Array) => {
  const names = readZipEntryNames(bytes);
  return (
    !!names &&
    names.includes('[Content_Types].xml') &&
    names.some((name) => name.startsWith('word/'))
  );
};

const isXlsx = (bytes: Uint8Array) => {
  const names = readZipEntryNames(bytes);
  return (
    !!names && names.includes('[Content_Types].xml') && names.some((name) => name.startsWith('xl/'))
  );
};

const isDoc = (bytes: Uint8Array) => !!readCfbStreamNames(bytes)?.includes('WordDocument');

const isXls = (bytes: Uint8Array) => {
  const names = readCfbStreamNames(bytes);
  return !!names && (names.includes('Workbook') || names.includes('Book'));
};

const OFFICE_SUBTYPE_CHECKS: Record<string, (bytes: Uint8Array) => boolean> = {
  'application/msword': isDoc,
  'application/vnd.ms-excel': isXls,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': isDocx,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': isXlsx,
};

/**
 * `bytes` 가 `claimedType` 의 파일 형식과 맞으면 true.
 * 시그니처가 없는 텍스트 형식은 앞부분에 NUL 바이트가 없는지만 본다. 모르는 타입은 false.
 */
export function matchesFileSignature(claimedType: string, bytes: Uint8Array): boolean {
  if (TEXT_TYPES.has(claimedType)) {
    return !bytes.subarray(0, TEXT_SNIFF_BYTES).includes(0x00);
  }
  // 'constructor'·'__proto__' 같은 값이 프로토타입 속성으로 잡히지 않도록 자기 속성만 본다.
  if (!Object.hasOwn(SIGNATURES, claimedType)) return false;
  const signatures = SIGNATURES[claimedType];
  if (!signatures.every((signature) => startsWith(bytes, signature))) return false;
  if (!Object.hasOwn(OFFICE_SUBTYPE_CHECKS, claimedType)) return true;
  return OFFICE_SUBTYPE_CHECKS[claimedType](bytes);
}
