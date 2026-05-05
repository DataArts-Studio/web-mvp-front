import type { ParseResult } from './schema';
import { detectFormat } from './format-detector';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_EXTENSIONS = ['.csv', '.xlsx'];

export class FileValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FileValidationError';
  }
}

function validateFile(file: File): void {
  const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    throw new FileValidationError(
      '지원하지 않는 파일 형식입니다. CSV 또는 XLSX 파일을 선택해주세요.',
    );
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new FileValidationError('파일 크기가 5MB를 초과합니다.');
  }
}

function isExcel(file: File): boolean {
  return file.name.toLowerCase().endsWith('.xlsx');
}

async function parseCsv(file: File): Promise<ParseResult> {
  const { default: Papa } = await import('papaparse');
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const headers = results.meta.fields ?? [];
        const rows = results.data as Record<string, string>[];

        if (headers.length === 0 || rows.length === 0) {
          reject(new FileValidationError('가져올 데이터가 없습니다.'));
          return;
        }

        resolve({
          headers,
          rows,
          totalRows: rows.length,
          detectedFormat: detectFormat(headers),
        });
      },
      error(err) {
        reject(
          new FileValidationError(
            `파일을 읽을 수 없습니다. 파일이 손상되지 않았는지 확인해주세요. (${err.message})`,
          ),
        );
      },
    });
  });
}

async function parseExcel(file: File): Promise<ParseResult> {
  const { default: readXlsxFile } = await import('read-excel-file/browser');
  const rows = await readXlsxFile(file);

  if (rows.length < 2) {
    throw new FileValidationError('가져올 데이터가 없습니다.');
  }

  const headers = rows[0].map((cell) => String(cell ?? ''));
  const dataRows = rows.slice(1).map((row) => {
    const record: Record<string, string> = {};
    headers.forEach((header, i) => {
      record[header] = String(row[i] ?? '');
    });
    return record;
  });

  return {
    headers,
    rows: dataRows,
    totalRows: dataRows.length,
    detectedFormat: detectFormat(headers),
  };
}

export async function parseFile(file: File): Promise<ParseResult> {
  validateFile(file);
  return isExcel(file) ? parseExcel(file) : parseCsv(file);
}
