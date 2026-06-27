import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '개인정보처리방침',
  description: 'qaground 개인정보처리방침 및 광고·쿠키 사용 안내.',
  alternates: { canonical: 'https://qaground.gettestea.com/privacy' },
};

const UPDATED = '2026-06-27';

export default function PrivacyPage() {
  return (
    <main className="bg-bg-1 text-text-1 mx-auto w-full max-w-3xl px-6 py-16 font-sans">
      <h1 className="text-2xl font-bold">개인정보처리방침</h1>
      <p className="text-text-3 mt-2 text-sm">시행일: {UPDATED}</p>

      <section className="text-text-2 mt-8 flex flex-col gap-6 text-sm leading-relaxed">
        <p>
          테스티아(Testea, 이하 &ldquo;회사&rdquo;)는 qaground(이하 &ldquo;서비스&rdquo;) 이용자의
          개인정보를 중요하게 생각하며, 「개인정보 보호법」 등 관련 법령을 준수합니다. 본 방침은
          서비스가 수집하는 정보와 그 처리, 광고·쿠키 사용에 대해 설명합니다.
        </p>

        <div>
          <h2 className="text-text-1 mb-2 text-base font-semibold">1. 수집하는 정보</h2>
          <p>
            서비스는 회원가입·로그인 없이 이용할 수 있으며, 이름·이메일 등 개인을 식별하는 정보를
            직접 수집하지 않습니다. 다만 서비스 개선과 통계 분석을 위해 접속 기기·브라우저 정보,
            방문·이용 기록, 쿠키 등 비식별 정보가 자동으로 수집될 수 있습니다.
          </p>
        </div>

        <div>
          <h2 className="text-text-1 mb-2 text-base font-semibold">2. 쿠키 사용</h2>
          <p>
            서비스는 이용 경험 제공과 분석, 광고를 위해 쿠키 및 유사 기술을 사용합니다. 이용자는
            브라우저 설정에서 쿠키 저장을 거부하거나 삭제할 수 있으며, 이 경우 일부 기능 이용이
            제한될 수 있습니다.
          </p>
        </div>

        <div>
          <h2 className="text-text-1 mb-2 text-base font-semibold">3. 광고 (Google AdSense)</h2>
          <p>
            서비스는 제3자 광고 사업자인 Google의 AdSense를 통해 광고를 게재할 수 있습니다. Google을
            비롯한 제3자 사업자는 쿠키를 사용해 이용자의 방문 기록을 바탕으로 광고를 제공할 수
            있습니다. 이용자는 Google의{' '}
            <a
              href="https://policies.google.com/technologies/ads"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              광고 설정
            </a>
            에서 맞춤 광고를 비활성화할 수 있습니다.
          </p>
        </div>

        <div>
          <h2 className="text-text-1 mb-2 text-base font-semibold">4. 분석 도구</h2>
          <p>
            서비스는 이용 통계 분석을 위해 Google Analytics를 사용할 수 있습니다. 수집된 정보는
            서비스 개선 목적의 통계 분석에만 이용됩니다.
          </p>
        </div>

        <div>
          <h2 className="text-text-1 mb-2 text-base font-semibold">5. 정보의 보관·파기</h2>
          <p>
            자동 수집된 비식별 정보는 분석 목적 달성에 필요한 기간 동안 보관 후 파기합니다. 관련
            법령이 보관을 요구하는 경우 해당 기간 동안 보관합니다.
          </p>
        </div>

        <div>
          <h2 className="text-text-1 mb-2 text-base font-semibold">6. 문의</h2>
          <p>
            개인정보 처리에 관한 문의는{' '}
            <a
              href="https://gettestea.com"
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              gettestea.com
            </a>{' '}
            을 통해 접수할 수 있습니다.
          </p>
        </div>

        <p className="text-text-3 text-xs">
          본 방침은 법령·서비스 변경에 따라 개정될 수 있으며, 개정 시 본 페이지에 공지합니다.
        </p>
      </section>
    </main>
  );
}
