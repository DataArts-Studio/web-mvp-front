import { ImageResponse } from 'next/og';

// 코드 생성 파비콘 (브랜드 primary 위 'Q'). 바이너리 에셋 없이 빌드 시 생성.
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0bb57f',
        color: '#ffffff',
        fontSize: 22,
        fontWeight: 700,
        borderRadius: 7,
      }}
    >
      Q
    </div>,
    { ...size }
  );
}
