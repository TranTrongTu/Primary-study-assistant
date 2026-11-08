import React from "react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { formatAIContent } from "../utils/formatContent";

export const SmartContent = ({ children, className = "", inline = false }) => {
  const sanitizedContent = formatAIContent(children);

  if (inline) {
    return (
      <span className={`inline-flex items-center justify-center ${className}`}>
        <ReactMarkdown
            remarkPlugins={[remarkMath]}
            rehypePlugins={[
                [rehypeKatex, { 
                throwOnError: false, 
                strict: false,
                output: 'html' 
                }]
            ]}
            components={{
                p: ({ node, ...props }) => inline ? <span {...props} /> : <p {...props} />,
            }}
        >
            {sanitizedContent}
        </ReactMarkdown>
      </span>
    );
  }

  return (
    <div className={`prose prose-slate dark:prose-invert max-w-none ${className}`}>
      <ReactMarkdown 
        remarkPlugins={[remarkMath]} 
        rehypePlugins={[rehypeKatex]}
      >
        {sanitizedContent}
      </ReactMarkdown>
    </div>
  );
};
