import { notFound } from 'next/navigation';

import BackOfficeComponentPreview from '@/dev/component-preview';

export default function ComponentPreviewPage() {
  if (process.env.NODE_ENV === 'production') {
    notFound();
  }

  return <BackOfficeComponentPreview />;
}
