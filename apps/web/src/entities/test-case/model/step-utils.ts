export function parseSteps(raw: string): string[] {
  if (!raw || !raw.trim()) return [''];

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((s: unknown) => (typeof s === 'string' ? s : String(s)));
    }
  } catch {
    // fallback: split by newlines or return as single step
  }

  // Try splitting by numbered lines (e.g. "1. ...\n2. ...")
  const lines = raw.split('\n').filter((l) => l.trim());
  if (lines.length > 1) {
    return lines.map((l) => l.replace(/^\d+\.\s*/, '').trim());
  }

  return [raw];
}

export function serializeSteps(steps: string[]): string {
  // 모든 항목이 비어있으면 빈 문자열 반환
  if (steps.every((s) => !s.trim())) return '';
  return JSON.stringify(steps);
}

export function stepsToText(steps: string[]): string {
  return steps.join('\n');
}

export function textToSteps(text: string): string[] {
  const lines = text.split('\n');
  return lines.length > 0 ? lines : [''];
}
