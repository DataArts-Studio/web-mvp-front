import { ogSize, renderOgImage } from './og-render';

export const runtime = 'edge';
export const alt = 'Testea - Test management platform';
export const size = ogSize;
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return renderOgImage(locale);
}
