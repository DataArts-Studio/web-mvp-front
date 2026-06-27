import { ImageResponse } from 'next/og';

// 소셜 공유용 OG 이미지 (코드 생성). 한글 폰트 미로딩 이슈 회피 위해 라틴 문자만 사용.
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px',
        background: '#0d1117',
        color: '#ffffff',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 24,
        }}
      >
        <div
          style={{
            width: 96,
            height: 96,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0bb57f',
            borderRadius: 20,
            fontSize: 64,
            fontWeight: 700,
          }}
        >
          Q
        </div>
        <div style={{ fontSize: 84, fontWeight: 800, letterSpacing: -2 }}>qaground</div>
      </div>
      <div style={{ marginTop: 40, fontSize: 40, color: '#0bb57f', fontWeight: 700 }}>
        Practice QA automation, free.
      </div>
      <div style={{ marginTop: 16, fontSize: 30, color: '#9ca3af' }}>
        Write Playwright &amp; API tests on real-world targets. by Testea
      </div>
    </div>,
    { ...size }
  );
}
