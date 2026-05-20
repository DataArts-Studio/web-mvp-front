import ReactMarkdown from 'react-markdown';

import Link from 'next/link';

import { getTextContent } from '@/shared/utils/markdown-utils';
import { slugify } from '@testea/util';
import remarkGfm from 'remark-gfm';

export { slugify };

interface DocsMarkdownContentProps {
  content: string;
}

export function DocsMarkdownContent({ content }: DocsMarkdownContentProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="border-line-2 typo-h1-heading text-text-1 mb-6 border-b pb-4">
            {children}
          </h1>
        ),
        h2: ({ children }) => {
          const id = slugify(getTextContent(children));
          return (
            <h2 id={id} className="typo-h2-heading text-text-1 mt-8 mb-4 scroll-mt-12">
              {children}
            </h2>
          );
        },
        h3: ({ children }) => {
          const id = slugify(getTextContent(children));
          return (
            <h3 id={id} className="typo-h3-heading text-text-1 mt-6 mb-3 scroll-mt-12">
              {children}
            </h3>
          );
        },
        p: ({ children }) => (
          <p className="typo-body2-normal text-text-2 mb-4 leading-relaxed">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="text-text-2 mb-4 ml-6 list-disc space-y-2">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="text-text-2 mb-4 ml-6 list-decimal space-y-2">{children}</ol>
        ),
        li: ({ children }) => <li className="typo-body2-normal">{children}</li>,
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
        hr: () => <hr className="border-line-2 my-8" />,
        strong: ({ children }) => <strong className="text-text-1 font-semibold">{children}</strong>,
        code: ({ children }) => (
          <code className="bg-bg-3 typo-caption-normal text-primary rounded px-1.5 py-0.5">
            {children}
          </code>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-primary text-text-3 my-4 border-l-4 pl-4">
            {children}
          </blockquote>
        ),
        a: ({ href, children }) => (
          <Link href={href || '#'} className="text-primary hover:text-primary/80 underline">
            {children}
          </Link>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
