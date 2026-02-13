import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export function GET(request: NextRequest) {
  const size = Number(request.nextUrl.searchParams.get('size')) || 192;

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: size * 0.5,
          background: '#0BB57F',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 700,
          borderRadius: size * 0.15,
        }}
      >
        T
      </div>
    ),
    {
      width: size,
      height: size,
    }
  );
}
