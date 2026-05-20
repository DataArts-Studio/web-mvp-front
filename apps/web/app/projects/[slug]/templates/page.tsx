import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: '템플릿 관리',
  description: '테스트 케이스 템플릿을 관리하고 재사용합니다.',
};

const Page = async ({ params }: { params: Promise<{ slug: string }> }) => {
  const { slug } = await params;
  // 템플릿 기능 펜딩 - 대시보드로 리다이렉트
  redirect(`/projects/${slug}`);
};

export default Page;
