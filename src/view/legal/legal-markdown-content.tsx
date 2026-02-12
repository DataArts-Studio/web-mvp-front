import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface LegalMarkdownContentProps {
  content: string;
}

export function LegalMarkdownContent({ content }: LegalMarkdownContentProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({ children }) => (
          <h1 className="mb-6 border-b border-line-2 pb-4 typo-h1-heading text-text-1">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="mb-4 mt-8 typo-h2-heading text-text-1">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="mb-3 mt-6 typo-h3-heading text-text-1">{children}</h3>
        ),
        p: ({ children }) => (
          <p className="mb-4 typo-body2-normal text-text-2 leading-relaxed">{children}</p>
        ),
        ul: ({ children }) => (
          <ul className="mb-4 ml-6 list-disc space-y-2 text-text-2">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-4 ml-6 list-decimal space-y-2 text-text-2">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="typo-body2-normal">{children}</li>
        ),
        table: ({ children }) => (
          <div className="mb-6 overflow-x-auto">
            <table className="w-full border-collapse border border-line-2 typo-body2-normal">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-bg-3">{children}</thead>
        ),
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
          <blockquote className="my-4 border-l-4 border-primary pl-4 italic text-text-3">
            {children}
          </blockquote>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
