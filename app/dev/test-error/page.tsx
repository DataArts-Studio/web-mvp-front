'use client';

import { useEffect, useState } from 'react';

export default function TestErrorPage() {
  const [shouldError, setShouldError] = useState(false);

  useEffect(() => {
    // 클라이언트에서만 에러 발생
    setShouldError(true);
  }, []);

  if (shouldError) {
    throw new Error('테스트 에러');
  }

  return <div>Loading...</div>;
}
