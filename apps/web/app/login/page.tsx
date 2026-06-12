import React from 'react';

import type { Metadata } from 'next';

import { LoginView } from '@/view/auth/login';

export const metadata: Metadata = {
  title: '로그인',
  description: 'Testea에 소셜 계정으로 로그인합니다.',
};

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

const Page = async ({ searchParams }: LoginPageProps) => {
  const { error } = await searchParams;
  return <LoginView error={error} />;
};

export default Page;
