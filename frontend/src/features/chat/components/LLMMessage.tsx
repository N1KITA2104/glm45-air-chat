import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeHighlight from 'rehype-highlight';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import type { Components } from 'react-markdown';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { FiClipboard, FiCheck } from "react-icons/fi";

type Props = {
  content: string;
};

const normaliseLineEndings = (text: string) => text.replace(/\r\n/g, "\n");

type MarkdownCodeProps = ComponentPropsWithoutRef<'code'> & {
  inline?: boolean;
};

type CodeBlockProps = ComponentPropsWithoutRef<'pre'> & {
  children: ReactNode;
};

const extractText = (node: ReactNode): string => {
  if (typeof node === 'string' || typeof node === 'number') {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(extractText).join('');
  }
  if (React.isValidElement(node)) {
    return extractText(node.props.children);
  }
  return '';
};

// --------------------------------------------------------------
// Custom Code Block Renderer
// --------------------------------------------------------------
const CodeBlock: React.FC<CodeBlockProps> = ({ children }) => {
  const [copied, setCopied] = useState(false);

  if (!React.isValidElement<MarkdownCodeProps>(children)) {
    return <pre className="llm-code-block__pre">{children}</pre>;
  }

  const codeElement = children;
  const className = codeElement.props.className;
  const langMatch = className?.match(/language-([\w+-]+)/i);
  const lang = (langMatch?.[1] ?? 'text').toUpperCase();
  const codeContent = extractText(codeElement.props.children);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(codeContent);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (error) {
      console.error('Failed to copy code block', error);
    }
  };

  const copyButtonClassName = [
    'llm-code-block__copy',
    copied ? 'llm-code-block__copy--copied' : null,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="llm-code-block">
      <div className="llm-code-block__header">
        <span className="llm-code-block__lang">{lang}</span>

        <button
          type="button"
          className={copyButtonClassName}
          onClick={handleCopy}
          title={copied ? 'Copied!' : 'Copy code'}
          aria-label={copied ? 'Code copied to clipboard' : 'Copy code to clipboard'}
        >
          {copied ? <FiCheck size={16} /> : <FiClipboard size={16} />}
          <span className="llm-code-block__copy-label">{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>

      <div className="llm-code-block__body">
        <pre className="llm-code-block__pre">
          {React.cloneElement(codeElement, {
            className,
          })}
        </pre>
      </div>
    </div>
  );
};

const MarkdownCode: React.FC<MarkdownCodeProps> = ({ inline, className, children, ...props }) => {
  if (inline) {
    const inlineClassName = ['llm-inline-code', className].filter(Boolean).join(' ');
    return (
      <code className={inlineClassName} {...props}>
        {children}
      </code>
    );
  }

  return (
    <code className={className} {...props}>
      {children}
    </code>
  );
};

// --------------------------------------------------------------
// Custom Table Renderers
// --------------------------------------------------------------
const Table: React.FC<ComponentPropsWithoutRef<'table'>> = ({ children, ...props }) => (
  <div style={{ overflowX: 'auto', margin: '16px 0' }}>
    <table {...props}>{children}</table>
  </div>
);

const TableHead: React.FC<ComponentPropsWithoutRef<'thead'>> = ({ children, ...props }) => (
  <thead {...props}>{children}</thead>
);

const TableBody: React.FC<ComponentPropsWithoutRef<'tbody'>> = ({ children, ...props }) => (
  <tbody {...props}>{children}</tbody>
);

const TableRow: React.FC<ComponentPropsWithoutRef<'tr'>> = ({ children, ...props }) => (
  <tr {...props}>{children}</tr>
);

const TableHeader: React.FC<ComponentPropsWithoutRef<'th'>> = ({ children, ...props }) => (
  <th {...props}>{children}</th>
);

const TableCell: React.FC<ComponentPropsWithoutRef<'td'>> = ({ children, ...props }) => (
  <td {...props}>{children}</td>
);

// --------------------------------------------------------------
// Sanitize Schema with Table Support
// --------------------------------------------------------------
const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    ...(defaultSchema.tagNames || []),
    'table',
    'thead',
    'tbody',
    'tfoot',
    'tr',
    'th',
    'td',
  ],
  attributes: {
    ...defaultSchema.attributes,
    table: defaultSchema.attributes?.table || ['align', 'valign'],
    thead: defaultSchema.attributes?.thead || ['align', 'valign'],
    tbody: defaultSchema.attributes?.tbody || ['align', 'valign'],
    tfoot: defaultSchema.attributes?.tfoot || ['align', 'valign'],
    tr: defaultSchema.attributes?.tr || ['align', 'valign'],
    th: defaultSchema.attributes?.th || ['align', 'valign', 'colspan', 'rowspan', 'scope'],
    td: defaultSchema.attributes?.td || ['align', 'valign', 'colspan', 'rowspan'],
  },
};

// --------------------------------------------------------------
// Components Mapping
// --------------------------------------------------------------
const components: Components = {
  code: MarkdownCode as Components["code"],
  pre: ({ children, ...props }) => <CodeBlock {...props}>{children}</CodeBlock>,
  a: ({ node, ...props }) => (
    <a {...props} target="_blank" rel="noopener noreferrer" />
  ),
  table: Table as Components["table"],
  thead: TableHead as Components["thead"],
  tbody: TableBody as Components["tbody"],
  tr: TableRow as Components["tr"],
  th: TableHeader as Components["th"],
  td: TableCell as Components["td"],
};

// --------------------------------------------------------------
// Main Component
// --------------------------------------------------------------
export const LLMMessage: React.FC<Props> = ({ content }) => {
  return (
    <div className="message-assistant">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw, rehypeHighlight, [rehypeSanitize, sanitizeSchema]]}
        components={components}
      >
        {normaliseLineEndings(content)}
      </ReactMarkdown>
    </div>
  );
};
