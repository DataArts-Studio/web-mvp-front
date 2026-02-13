import { Children, isValidElement } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9가-힣ㄱ-ㅎㅏ-ㅣ-]/g, '')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '');
}

function getTextContent(children: React.ReactNode): string {
  return Children.toArray(children)
    .map((child) => {
      if (typeof child === 'string') return child;
      if (isValidElement<{ children?: React.ReactNode }>(child) && child.props.children) {
        return getTextContent(child.props.children);
      }
      return '';
    })
    .join('');
}

interface DocsMarkdownContentProps {
  content: string;
}

export function DocsMarkdownContent({ content }: DocsMarkdownContentProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="mb-6 border-b border-line-2 pb-4 typo-h1-heading text-text-1">
            {children}
          </h1>
        ),
        h2: ({ children }) => {
          const id = slugify(getTextContent(children));
          return (
            <h2 id={id} className="mb-4 mt-8 scroll-mt-12 typo-h2-heading text-text-1">
              {children}
            </h2>
          );
        },
        h3: ({ children }) => {
          const id = slugify(getTextContent(children));
          return (
            <h3 id={id} className="mb-3 mt-6 scroll-mt-12 typo-h3-heading text-text-1">
              {children}
            </h3>
          );
        },
        p: ({ children }) => (
          <p className="mb-4 typo-body2-normal text-text-2 leading-relaxed">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="mb-4 ml-6 list-disc space-y-2 text-text-2">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-4 ml-6 list-decimal space-y-2 text-text-2">{children}</ol>
        ),
        li: ({ children }) => <li className="typo-body2-normal">{children}</li>,
        table: ({ children }) => (
          <div className="mb-6 overflow-x-auto">
            <table className="w-full border-collapse border border-line-2 typo-body2-normal">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-bg-3">{children}</thead>,
        th: ({ children }) => (
          <th className="border border-line-2 px-4 py-2 text-left text-text-1">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-line-2 px-4 py-2 text-text-2">{children}</td>
        ),
        hr: () => <hr className="my-8 border-line-2" />,
        strong: ({ children }) => (
          <strong className="font-semibold text-text-1">{children}</strong>
        ),
        code: ({ children }) => (
          <code className="rounded bg-bg-3 px-1.5 py-0.5 typo-caption-normal text-primary">
            {children}
          </code>
        ),
        blockquote: ({ children }) => (
          <blockquote className="my-4 border-l-4 border-primary pl-4 text-text-3">
            {children}
          </blockquote>
        ),
        a: ({ href, children }) => (
          <Link
            href={href || '#'}
            className="text-primary underline hover:text-primary/80"
          >
            {children}
          </Link>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
