'use client';

import { useEffect, useState } from 'react';

export default function TestErrorPage() {
  const [shouldError, setShouldError] = useState(false);

  useEffect(() => {
    // 클라이언트에서만 에러 발생
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 의도적으로 마운트 후 클라이언트 전용 에러를 트리거하는 dev 테스트 페이지. mount-once 1회성
    setShouldError(true);
  }, []);

  if (shouldError) {
    throw new Error('테스트 에러');
  }

  return <div>Loading...</div>;
}
