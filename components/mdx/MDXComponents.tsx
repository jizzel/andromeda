import type { MDXComponents } from "mdx/types";
import Image from "next/image";
import Link from "next/link";

/**
 * Custom components for MDX content
 * These override default HTML elements with styled versions
 */
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return {
    // Headings
    h1: ({ children }) => (
      <h1 className="mdx-heading text-4xl font-bold mb-6 mt-8 first:mt-0">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="mdx-heading text-3xl font-bold mb-4 mt-12 first:mt-0 scroll-mt-20">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="mdx-heading text-2xl font-semibold mb-3 mt-8 scroll-mt-20">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="mdx-heading text-xl font-semibold mb-2 mt-6">
        {children}
      </h4>
    ),

    // Paragraphs and text
    p: ({ children }) => (
      <p className="mdx-text text-base leading-relaxed mb-6">
        {children}
      </p>
    ),

    // Links
    a: ({ href, children }) => {
      const isExternal = href?.startsWith("http");
      return (
        <Link
          href={href || "#"}
          className="mdx-link hover:underline transition-colors"
          {...(isExternal && {
            target: "_blank",
            rel: "noopener noreferrer",
          })}
        >
          {children}
        </Link>
      );
    },

    // Lists
    ul: ({ children }) => (
      <ul className="mdx-text list-disc list-inside mb-6 space-y-2">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="mdx-text list-decimal list-inside mb-6 space-y-2">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="mdx-text text-base leading-relaxed">{children}</li>
    ),

    // Code blocks
    pre: ({ children }) => (
      <pre className="bg-[var(--andromeda-secondary)] rounded-lg p-4 mb-6 overflow-x-auto border border-white/10 light:border-black/10">
        {children}
      </pre>
    ),
    code: ({ children, className }) => {
      const isInline = !className;
      if (isInline) {
        return (
          <code className="mdx-inline-code px-1.5 py-0.5 rounded text-sm font-mono">
            {children}
          </code>
        );
      }
      return (
        <code className={`${className || ""} text-sm font-mono block`}>
          {children}
        </code>
      );
    },

    // Blockquotes
    blockquote: ({ children }) => (
      <blockquote className="mdx-blockquote border-l-4 pl-4 py-2 mb-6 italic">
        {children}
      </blockquote>
    ),

    // Horizontal rule
    hr: () => (
      <hr className="border-t border-white/10 light:border-black/10 my-8" />
    ),

    // Tables
    table: ({ children }) => (
      <div className="overflow-x-auto mb-6">
        <table className="min-w-full divide-y divide-white/10 light:divide-black/10">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-[var(--andromeda-secondary)]">{children}</thead>
    ),
    tbody: ({ children }) => (
      <tbody className="divide-y divide-white/10 light:divide-black/10">
        {children}
      </tbody>
    ),
    tr: ({ children }) => <tr>{children}</tr>,
    th: ({ children }) => (
      <th className="mdx-heading px-4 py-3 text-left text-sm font-semibold">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="mdx-text px-4 py-3 text-sm">
        {children}
      </td>
    ),

    // Images
    img: ({ src, alt }) => (
      <Image
        src={src || ""}
        alt={alt || ""}
        width={800}
        height={600}
        className="rounded-lg mb-6 w-full h-auto"
      />
    ),

    // Custom components (can be used in MDX)
    Callout: ({ children, type = "info" }: { children: React.ReactNode; type?: "info" | "warning" | "success" }) => {
      const styles = {
        info: "bg-blue-500/10 border-blue-500/30",
        warning: "bg-yellow-500/10 border-yellow-500/30",
        success: "bg-green-500/10 border-green-500/30",
      };

      return (
        <div className={`${styles[type]} border rounded-lg p-4 mb-6`}>
          <div className="mdx-text">{children}</div>
        </div>
      );
    },

    ...components,
  };
}
