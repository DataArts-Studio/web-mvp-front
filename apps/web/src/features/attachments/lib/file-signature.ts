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
 * `bytes` 가 `claimedType` 의 파일 형식과 맞으면 true.
 * 시그니처가 없는 텍스트 형식은 앞부분에 NUL 바이트가 없는지만 본다. 모르는 타입은 false.
 */
export function matchesFileSignature(claimedType: string, bytes: Uint8Array): boolean {
  if (TEXT_TYPES.has(claimedType)) {
    return !bytes.subarray(0, TEXT_SNIFF_BYTES).includes(0x00);
  }
  const signatures = SIGNATURES[claimedType];
  if (!signatures) return false;
  return signatures.every((signature) => startsWith(bytes, signature));
}
