import Link from 'next/link';

const NAV = [
  { label: '플레이그라운드', href: '/playground' },
  { label: '작동 방식', href: '#how' },
  { label: '과제전형', href: '#assessment' },
];

export const LandingHeader = () => {
  return (
    <header className="border-line-2 bg-bg-1/80 sticky top-0 z-50 border-b backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-baseline gap-2">
          <a href="#top" className="text-lg font-bold tracking-tight">
            qa<span className="text-primary">ground</span>
          </a>
          <a
            href="https://gettestea.com"
            target="_blank"
            rel="noreferrer"
            className="text-text-3 hover:text-text-2 hidden text-xs transition-colors sm:inline"
          >
            by Testea
          </a>
        </div>

        <nav className="flex items-center gap-1 sm:gap-2">
          {NAV.map((item) => {
            const className =
              'text-text-2 hover:text-text-1 hidden rounded-md px-3 py-2 text-sm transition-colors sm:inline-block';

            if (item.href.startsWith('/')) {
              return (
                <Link key={item.href} href={item.href} className={className}>
                  {item.label}
                </Link>
              );
            }

            return (
              <a key={item.href} href={item.href} className={className}>
                {item.label}
              </a>
            );
          })}
          <Link
            href="/challenges"
            className="bg-primary rounded-button hover:bg-primary/90 active:bg-primary/80 ml-1 inline-flex h-9 items-center justify-center px-4 text-sm font-medium text-white transition-colors"
          >
            연습 시작하기
          </Link>
        </nav>
      </div>
    </header>
  );
};
