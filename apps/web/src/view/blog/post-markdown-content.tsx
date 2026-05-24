import ReactMarkdown from 'react-markdown';

import Image from 'next/image';
import Link from 'next/link';

import { getTextContent } from '@/shared/utils/markdown-utils';
import { slugify } from '@testea/util';
import remarkGfm from 'remark-gfm';

export { slugify };

interface PostMarkdownContentProps {
  content: string;
}

/**
 * 블로그·소식 본문 렌더러. docs 와 동일한 react-markdown + remark-gfm 스택을
 * 사용하되 본문 타이포그래피만 분리해 글 상세 페이지 톤에 맞춘다.
 */
export function PostMarkdownContent({ content }: PostMarkdownContentProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="typo-h1-heading text-text-1 mt-10 mb-5">{children}</h1>
        ),
        h2: ({ children }) => {
          const id = slugify(getTextContent(children));
          return (
            <h2 id={id} className="typo-h2-heading text-text-1 mt-10 mb-4 scroll-mt-20">
              {children}
            </h2>
          );
        },
        h3: ({ children }) => {
          const id = slugify(getTextContent(children));
          return (
            <h3 id={id} className="typo-h3-heading text-text-1 mt-8 mb-3 scroll-mt-20">
              {children}
            </h3>
          );
        },
        p: ({ children }) => (
          <p className="typo-body1-normal text-text-2 mb-5 leading-relaxed">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="text-text-2 mb-5 ml-6 list-disc space-y-2">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="text-text-2 mb-5 ml-6 list-decimal space-y-2">{children}</ol>
        ),
        li: ({ children }) => <li className="typo-body1-normal">{children}</li>,
        table: ({ children }) => (
          <div className="mb-6 overflow-x-auto">
            <table className="border-line-2 typo-body2-normal w-full border-collapse border">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-bg-3">{children}</thead>,
        th: ({ children }) => (
          <th className="border-line-2 text-text-1 border px-4 py-2 text-left">{children}</th>
        ),
        td: ({ children }) => (
          <td className="border-line-2 text-text-2 border px-4 py-2">{children}</td>
        ),
        hr: () => <hr className="border-line-2 my-10" />,
        strong: ({ children }) => <strong className="text-text-1 font-semibold">{children}</strong>,
        code: ({ children, className }) => {
          // ``` 펜스 블록은 className 이 붙고, 인라인 코드는 className 이 없다.
          if (className) {
            return (
              <code className={`${className} bg-bg-3 typo-caption-normal text-text-2 block`}>
                {children}
              </code>
            );
          }
          return (
            <code className="bg-bg-3 typo-caption-normal text-primary rounded px-1.5 py-0.5">
              {children}
            </code>
          );
        },
        pre: ({ children }) => (
          <pre className="bg-bg-3 border-line-2 mb-5 overflow-x-auto rounded-lg border p-4">
            {children}
          </pre>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-primary text-text-3 my-6 border-l-4 pl-4 italic">
            {children}
          </blockquote>
        ),
        a: ({ href, children }) => (
          <Link href={href || '#'} className="text-primary hover:text-primary/80 underline">
            {children}
          </Link>
        ),
        img: ({ src, alt }) => {
          if (typeof src !== 'string' || !src) return null;
          return (
            <span className="my-6 block">
              <Image
                src={src}
                alt={alt || ''}
                width={1200}
                height={630}
                className="border-line-2 rounded-lg border"
              />
            </span>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
