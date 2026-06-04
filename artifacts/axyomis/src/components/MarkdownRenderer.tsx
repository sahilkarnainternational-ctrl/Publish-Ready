import React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import type { Components } from 'react-markdown';

export interface MarkdownRendererProps {
  children: string;
  components?: Components;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ children, components = {}, className = '' }) => (
  <div className={className}>
    <Markdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        a: ({ node, ...props }) => (
          <a {...props} className="text-cyan-300 hover:text-cyan-200 underline transition-colors" />
        ),
        p: ({ node, ...props }) => <p className="text-slate-200 leading-relaxed my-3" {...props} />,
        li: ({ node, ...props }) => <li className="ml-5 list-disc text-slate-300" {...props} />,
        code: ({ node, inline, className: codeClassName, children, ...props }: any) =>
          inline ? (
            <code className={`rounded bg-slate-900 px-1 py-0.5 text-[0.92em] font-mono ${codeClassName ?? ''}`.trim()} {...props}>
              {children}
            </code>
          ) : (
            <pre className="my-4 overflow-x-auto rounded-2xl bg-slate-950/80 p-4 text-xs leading-6 text-slate-100">
              <code className={codeClassName} {...props}>
                {children}
              </code>
            </pre>
          ),
        ...components,
      }}
    >
      {children}
    </Markdown>
  </div>
);
