import { Components, ExtraProps } from 'react-markdown';

import CodeBlock from '@/components/code-block';

export const markdownComponents: Components = {
  code: function CodeComponent(props: React.HTMLAttributes<HTMLElement> & ExtraProps & { inline?: boolean }) {
    const { inline, className, children, ...restProps } = props;
    const match = /language-(\w+)/.exec(className || '');
    const language = match ? match[1] : '';
    const value = String(children).replace(/\n$/, '');
    if (!inline && language) {
      return <CodeBlock language={language} value={value} />;
    }
    return (
      <code className={'bg-gray-100 px-1 py-0.5 rounded text-gray-800'} {...restProps}>
        {children}
      </code>
    );
  },
  h1({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
      <h1 className="text-2xl font-bold mb-4 mt-6 text-gray-900" {...props}>
        {children}
      </h1>
    );
  },
  h2({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
      <h2 className="text-xl font-semibold mb-3 mt-5 text-gray-900" {...props}>
        {children}
      </h2>
    );
  },
  h3({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
      <h3 className="text-lg font-medium mb-2 mt-4 text-gray-900" {...props}>
        {children}
      </h3>
    );
  },
  h4({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
      <h4 className="text-base font-medium mb-2 mt-3 text-gray-900" {...props}>
        {children}
      </h4>
    );
  },
  h5({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
      <h5 className="text-sm font-medium mb-1 mt-2 text-gray-900" {...props}>
        {children}
      </h5>
    );
  },
  h6({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
      <h6 className="text-sm font-medium mb-1 mt-2 text-gray-700" {...props}>
        {children}
      </h6>
    );
  },
  p({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
    return (
      <p className="mb-3 leading-relaxed" {...props}>
        {children}
      </p>
    );
  },
  ul({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) {
    return (
      <ul className="list-disc pl-6 mb-3 space-y-1" {...props}>
        {children}
      </ul>
    );
  },
  ol({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) {
    return (
      <ol className="list-decimal pl-6 mb-3 space-y-1" {...props}>
        {children}
      </ol>
    );
  },
  li({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) {
    return (
      <li className="leading-relaxed" {...props}>
        {children}
      </li>
    );
  },
  blockquote({ children, ...props }: React.BlockquoteHTMLAttributes<HTMLElement>) {
    return (
      <blockquote className="border-l-4 border-gray-300 pl-4 italic text-gray-700 my-3" {...props}>
        {children}
      </blockquote>
    );
  },
  strong({ children, ...props }: React.HTMLAttributes<HTMLElement>) {
    return (
      <strong className="font-semibold text-gray-900" {...props}>
        {children}
      </strong>
    );
  },
  em({ children, ...props }: React.HTMLAttributes<HTMLElement>) {
    return (
      <em className="italic" {...props}>
        {children}
      </em>
    );
  },
};
