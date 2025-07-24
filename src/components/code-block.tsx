import React, { useEffect, useRef, useState } from 'react';

import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-typescript';
import 'prismjs/themes/prism-solarizedlight.css';

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

export const CodeBlock: React.FC<CodeBlockProps> = ({ language = '', value }) => {
  const [copied, setCopied] = useState(false);
  const codeRef = useRef<HTMLElement>(null);

  const langLabel = languageMap[language] || language || 'Code';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (err) {
      setCopied(false);
    }
  };

  useEffect(() => {
    if (codeRef.current) {
      Prism.highlightElement(codeRef.current);
    }
  }, [value, language]);

  return (
    <div className="my-4 rounded-lg border border-gray-200 bg-gray-50 overflow-hidden shadow-md">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b border-gray-200">
        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">{langLabel}</span>
        <button
          onClick={handleCopy}
          className="text-xs px-2 py-1 rounded bg-gray-200 hover:bg-gray-300 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm bg-gray-50" style={{ background: 'transparent' }}>
        <code ref={codeRef} className={`language-${language} bg-transparent`}>
          {value}
        </code>
      </pre>
    </div>
  );
};

export default CodeBlock;
