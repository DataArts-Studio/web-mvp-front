import { notFound } from 'next/navigation';

import { SANDBOXES } from '@/view/sandbox';

export function generateStaticParams() {
  return Object.keys(SANDBOXES).map((slug) => ({ slug }));
}

export default async function SandboxPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const Sandbox = SANDBOXES[slug];
  if (!Sandbox) notFound();
  return <Sandbox />;
}
