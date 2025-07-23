import React, { useState } from 'react';

interface CodeBlockProps {
  language?: string;
  value: string;
}

const languageMap: Record<string, string> = {
  js: 'JavaScript',
  jsx: 'JavaScript (JSX)',
  ts: 'TypeScript',
  tsx: 'TypeScript (TSX)',
  py: 'Python',
  java: 'Java',
  cpp: 'C++',
  c: 'C',
  cs: 'C#',
  go: 'Go',
  rb: 'Ruby',
  php: 'PHP',
  swift: 'Swift',
  rs: 'Rust',
  sh: 'Shell',
  html: 'HTML',
  css: 'CSS',
  json: 'JSON',
  md: 'Markdown',
};

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const langLabel = languageMap[language || ''] || language || 'Code';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (err) {
      setCopied(false);
    }
  };

  return (
    <>
      <div className="my-4 rounded-lg border border-gray-300 bg-gray-900 overflow-hidden shadow-md">
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
          <span className="text-xs font-semibold text-gray-200 uppercase tracking-wide">{langLabel}</span>
          <button
            onClick={handleCopy}
            className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <pre className="overflow-x-auto p-4 text-sm text-gray-100 bg-gray-900">
          <code className={`language-${language}`}>{value}</code>
        </pre>
      </div>
    </>
  );
};

export default CodeBlock;
