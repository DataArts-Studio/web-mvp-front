import { ImageResponse } from 'next/og';

/**
 * 마케팅 로케일 OG/Twitter 이미지 공유 렌더. opengraph-image.tsx·twitter-image.tsx 가
 * 각자 정적 config(runtime/size/...)를 export 하고, 렌더만 이 함수로 위임한다.
 * (라우트 파일은 config 를 re-export 할 수 없어 모듈로 분리)
 */
export const ogSize = {
  width: 1200,
  height: 630,
};

const COPY: Record<string, { tagline: string; description: string }> = {
  ko: {
    tagline: '테스트 케이스 작성, 단 5분이면 끝!',
    description: '효율적인 테스트 케이스 관리와 협업을 위한 플랫폼',
  },
  en: {
    tagline: 'Write test cases in just 5 minutes.',
    description: 'A platform for efficient test case management and collaboration',
  },
};

export function renderOgImage(locale: string): ImageResponse {
  const copy = COPY[locale] ?? COPY.ko;

  return new ImageResponse(
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0a0a',
        backgroundImage: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 100%)',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: `linear-gradient(to right, rgba(11, 181, 127, 0.05) 1px, transparent 1px),
                              linear-gradient(to bottom, rgba(11, 181, 127, 0.05) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div
        style={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(11, 181, 127, 0.3) 0%, transparent 70%)',
        }}
      />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              backgroundColor: '#0BB57F',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontSize: 36, color: '#fff', fontWeight: 700 }}>T</span>
          </div>
          <span style={{ fontSize: 72, fontWeight: 700, color: '#ffffff', letterSpacing: -2 }}>
            Testea
          </span>
        </div>

        <span style={{ fontSize: 32, color: '#0BB57F', fontWeight: 600 }}>{copy.tagline}</span>

        <span style={{ fontSize: 24, color: '#a0a0a0', marginTop: 8 }}>{copy.description}</span>
      </div>

      <div
        style={{
          position: 'absolute',
          bottom: 40,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 20, color: '#666' }}>gettestea.com</span>
      </div>
    </div>,
    {
      ...ogSize,
    }
  );
}
