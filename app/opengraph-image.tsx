import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Testea - 테스트 관리 플랫폼';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
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
        {/* Grid pattern overlay */}
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

        {/* Gradient accent */}
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

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 24,
          }}
        >
          {/* Logo text */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
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
            <span
              style={{
                fontSize: 72,
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: -2,
              }}
            >
              Testea
            </span>
          </div>

          {/* Tagline */}
          <span
            style={{
              fontSize: 32,
              color: '#0BB57F',
              fontWeight: 600,
            }}
          >
            테스트 케이스 작성, 단 5분이면 끝!
          </span>

          {/* Description */}
          <span
            style={{
              fontSize: 24,
              color: '#a0a0a0',
              marginTop: 8,
            }}
          >
            효율적인 테스트 케이스 관리와 협업을 위한 플랫폼
          </span>
        </div>

        {/* Bottom URL */}
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
      </div>
    ),
    {
      ...size,
    }
  );
}
