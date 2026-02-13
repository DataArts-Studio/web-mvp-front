'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, Mail, Github, Sparkles, Heart, Coffee, Code2, Server, Palette, MessageCircle } from 'lucide-react';

import { Logo } from '@/shared/ui/logo';
import { Container, MainContainer } from '@/shared/lib/primitives';
import { Footer } from '@/widgets/footer';

interface TeamMember {
  name: string;
  role: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const teamMembers: TeamMember[] = [
  {
    name: '팀원 A',
    role: 'Frontend Developer',
    description: '사용자 경험을 최우선으로 생각하며, 깔끔한 코드를 사랑합니다.',
    icon: Code2,
  },
  {
    name: '팀원 B',
    role: 'Backend Developer',
    description: '안정적인 서비스를 위해 늘 고민합니다.',
    icon: Server,
  },
  {
    name: '팀원 C',
    role: 'Product Designer',
    description: '사용자의 마음을 읽는 디자인을 추구합니다.',
    icon: Palette,
  },
];

const values = [
  {
    icon: Sparkles,
    title: '심플함',
    description: '복잡한 것을 단순하게, 테스트 관리의 본질에 집중해요.',
  },
  {
    icon: Heart,
    title: '사용자 중심',
    description: 'QA 엔지니어와 개발자의 입장에서 생각하고 만들어요.',
  },
  {
    icon: Coffee,
    title: '즐거움',
    description: '지루한 테스트 관리도 즐겁게! 티타임처럼 편안하게.',
  },
];

export function TeamView() {
  return (
    <Container className="flex min-h-screen w-full flex-col bg-bg-1 font-sans text-text-1">
      <MainContainer className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 pb-24 pt-10">
        {/* 뒤로가기 */}
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1 text-text-3 transition-colors hover:text-text-1"
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="typo-label-normal">홈으로</span>
        </Link>

        {/* 헤더 */}
        <div className="mb-12 text-center">
          <div className="mb-6 flex justify-center">
            <Image
              src="/teacup/tea-cup-happy.svg"
              alt="Testea 마스코트"
              width={120}
              height={120}
              className="animate-bounce-gentle"
            />
          </div>
          <h1 className="typo-title-heading text-text-1 mb-4">
            테스티아를 만드는 사람들
          </h1>
          <p className="typo-body1-normal text-text-2 max-w-2xl mx-auto">
            &ldquo;테스트 관리, 왜 이렇게 복잡할까?&rdquo;라는 질문에서 시작했어요.
            <br />
            스프레드시트에서 벗어나, 더 쉽고 즐거운 테스트 관리를 만들고 있습니다.
          </p>
        </div>

        {/* 스토리 섹션 */}
        <section className="mb-16">
          <div className="rounded-4 border border-line-2 bg-bg-2 p-8">
            <h2 className="typo-h2-heading text-primary mb-4 flex items-center gap-2">
              <MessageCircle className="h-6 w-6" />
              우리의 이야기
            </h2>
            <div className="space-y-4 typo-body2-normal text-text-2 leading-relaxed">
              <p>
                테스티아는 <strong className="text-text-1">QA 엔지니어와 개발자</strong>가
                함께 모여 만든 테스트 케이스 관리 도구예요.
              </p>
              <p>
                우리도 예전엔 구글 스프레드시트로 테스트 케이스를 관리했어요.
                버전 관리는 엉망이고, 실행 결과 추적은 더 힘들었죠.
                &ldquo;이거 분명 더 좋은 방법이 있을 텐데...&rdquo; 하고 생각했어요.
              </p>
              <p>
                그래서 직접 만들기로 했습니다.
                <strong className="text-text-1"> 복잡함은 덜고, 필요한 것만 담은</strong>
                {' '}테스트 관리 도구를요.
              </p>
              <p>
                티타임처럼 편안하게, 차 한 잔의 여유를 담아 <strong className="text-primary">테스티아(Testea)</strong>라고
                이름 지었어요.
              </p>
            </div>
          </div>
        </section>

        {/* 핵심 가치 */}
        <section className="mb-16">
          <h2 className="typo-h2-heading text-text-1 mb-6 text-center">
            우리가 중요하게 생각하는 것
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {values.map((value) => (
              <div
                key={value.title}
                className="rounded-3 border border-line-2 bg-bg-2 p-6 text-center hover:border-primary/50 transition-colors"
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <value.icon className="h-6 w-6" />
                </div>
                <h3 className="typo-body1-heading text-text-1 mb-2">{value.title}</h3>
                <p className="typo-body2-normal text-text-3">{value.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 연락처 */}
        <section>
          <div className="rounded-4 border border-line-2 bg-gradient-to-br from-primary/5 to-primary/10 p-8 text-center">
            <h2 className="typo-h2-heading text-text-1 mb-3">
              함께 이야기해요
            </h2>
            <p className="typo-body2-normal text-text-2 mb-6">
              피드백, 제안, 또는 그냥 인사도 환영해요!
            </p>
            <div className="flex justify-center gap-4">
              <a
                href="mailto:gettestea@gmail.com"
                className="inline-flex items-center gap-2 rounded-2 border border-line-2 bg-bg-2 px-4 py-2 typo-body2-heading text-text-2 hover:border-primary hover:text-primary transition-colors"
              >
                <Mail className="h-4 w-4" />
                이메일 보내기
              </a>
            </div>
          </div>
        </section>
      </MainContainer>

      <Footer />
    </Container>
  );
}
