'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { cn } from '@/lib/utils';

interface MarkdownProps {
  content: string;
  className?: string;
}

export function Markdown({ content, className }: MarkdownProps) {
  return (
    <div className={cn('prose prose-sm max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          // Custom styling for different elements
          h1: ({ children }) => <h1 className="text-xl font-bold text-gray-900 mb-3 mt-6 first:mt-0">{children}</h1>,
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold text-gray-800 mb-2 mt-5 first:mt-0">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-gray-800 mb-2 mt-4 first:mt-0">{children}</h3>
          ),
          p: ({ children }) => <p className="text-gray-700 mb-3 leading-relaxed last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="list-disc list-inside mb-3 space-y-1 text-gray-700">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal list-inside mb-3 space-y-1 text-gray-700">{children}</ol>,
          li: ({ children }) => <li className="text-gray-700">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-teal-200 pl-4 italic text-gray-600 my-3 bg-teal-50 py-2 rounded-r-md">
              {children}
            </blockquote>
          ),
          code: ({ inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <div className="my-3">
                <div className="bg-gray-100 text-xs text-gray-600 px-3 py-1 rounded-t-md border-b border-gray-200">
                  {match[1]}
                </div>
                <pre className="bg-gray-50 p-3 rounded-b-md overflow-x-auto border border-gray-200 border-t-0">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            ) : (
              <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <div className="my-3">
              <pre className="bg-gray-50 p-3 rounded-md overflow-x-auto border border-gray-200">{children}</pre>
            </div>
          ),
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto">
              <table className="min-w-full border border-gray-200 rounded-md">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-gray-50">{children}</thead>,
          tbody: ({ children }) => <tbody className="divide-y divide-gray-200">{children}</tbody>,
          th: ({ children }) => (
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">{children}</td>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              className="text-teal-600 hover:text-teal-700 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
          em: ({ children }) => <em className="italic text-gray-700">{children}</em>,
          hr: () => <hr className="my-4 border-t border-gray-200" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
