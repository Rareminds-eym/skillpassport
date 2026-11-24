import ReactMarkdown, { type Components } from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import './math-markdown.css';

// Convert model TeX delimiters before Markdown consumes their backslashes.
// Leave code samples untouched and require explicit delimiters for mathematics.
export function normalizeMathDelimiters(content: string): string {
  return content.replace(/(`{3,}|~{3,})[^\n]*\n[\s\S]*?(?:\1|$)|(`+)[^`]*?\2|\\+\[([\s\S]*?)\\+\]|\\+\(([\s\S]*?)\\+\)/g,
    (match, _fence, _code, block: string | undefined, inline: string | undefined) => {
      if (block !== undefined) return `\n\n$$\n${block.trim()}\n$$\n\n`;
      if (inline !== undefined) return `$${inline.trim()}$`;
      return match;
    });
}

export default function MathMarkdown({ children, components, inline = false }: {
  children: string;
  components?: Components;
  inline?: boolean;
}) {
  const content = <ReactMarkdown
    remarkPlugins={[remarkMath]}
    rehypePlugins={[[rehypeKatex, { trust: false, strict: 'ignore', throwOnError: false }]]}
    components={inline ? { ...components, p: ({ children }) => <span>{children}</span> } : components}
  >{normalizeMathDelimiters(children)}</ReactMarkdown>;
  return inline ? <span className="tutor-math">{content}</span> : <div className="tutor-math min-w-0">{content}</div>;
}
