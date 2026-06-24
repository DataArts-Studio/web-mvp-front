import Link from 'next/link';

export const PlaygroundHeader = () => {
  return (
    <header className="border-line-2 bg-bg-1/80 sticky top-0 z-50 border-b backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-lg font-bold tracking-tight">
          qa<span className="text-primary">ground</span>
        </Link>
        <Link
          href="/challenges"
          className="text-text-2 hover:text-text-1 text-sm transition-colors"
        >
          챌린지
        </Link>
      </div>
    </header>
  );
};
