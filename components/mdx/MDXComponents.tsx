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
      <h1 className="text-4xl font-bold mb-6 text-[var(--andromeda-text-primary)] mt-8 first:mt-0">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-3xl font-bold mb-4 text-[var(--andromeda-text-primary)] mt-12 first:mt-0 scroll-mt-20">
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-2xl font-semibold mb-3 text-[var(--andromeda-text-primary)] mt-8 scroll-mt-20">
        {children}
      </h3>
    ),
    h4: ({ children }) => (
      <h4 className="text-xl font-semibold mb-2 text-[var(--andromeda-text-primary)] mt-6">
        {children}
      </h4>
    ),

    // Paragraphs and text
    p: ({ children }) => (
      <p className="text-base leading-relaxed mb-6 text-[var(--andromeda-text-primary)]">
        {children}
      </p>
    ),

    // Links
    a: ({ href, children }) => {
      const isExternal = href?.startsWith("http");
      return (
        <Link
          href={href || "#"}
          className="text-[var(--andromeda-highlight)] hover:underline transition-colors"
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
      <ul className="list-disc list-inside mb-6 space-y-2 text-[var(--andromeda-text-primary)]">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="list-decimal list-inside mb-6 space-y-2 text-[var(--andromeda-text-primary)]">
        {children}
      </ol>
    ),
    li: ({ children }) => (
      <li className="text-base leading-relaxed">{children}</li>
    ),

    // Code blocks
    pre: ({ children }) => (
      <pre className="bg-[var(--andromeda-secondary)] rounded-lg p-4 mb-6 overflow-x-auto border border-white/10 dark:border-white/10 light:border-black/10">
        {children}
      </pre>
    ),
    code: ({ children, className }) => {
      const isInline = !className;
      if (isInline) {
        return (
          <code className="bg-[var(--andromeda-secondary)] text-[var(--andromeda-accent-beige)] px-1.5 py-0.5 rounded text-sm font-mono">
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
      <blockquote className="border-l-4 border-[var(--andromeda-accent-beige)] pl-4 py-2 mb-6 italic text-[var(--andromeda-text-secondary)]">
        {children}
      </blockquote>
    ),

    // Horizontal rule
    hr: () => (
      <hr className="border-t border-white/10 dark:border-white/10 light:border-black/10 my-8" />
    ),

    // Tables
    table: ({ children }) => (
      <div className="overflow-x-auto mb-6">
        <table className="min-w-full divide-y divide-white/10 dark:divide-white/10 light:divide-black/10">
          {children}
        </table>
      </div>
    ),
    thead: ({ children }) => (
      <thead className="bg-[var(--andromeda-secondary)]">{children}</thead>
    ),
    tbody: ({ children }) => (
      <tbody className="divide-y divide-white/10 dark:divide-white/10 light:divide-black/10">
        {children}
      </tbody>
    ),
    tr: ({ children }) => <tr>{children}</tr>,
    th: ({ children }) => (
      <th className="px-4 py-3 text-left text-sm font-semibold text-[var(--andromeda-text-primary)]">
        {children}
      </th>
    ),
    td: ({ children }) => (
      <td className="px-4 py-3 text-sm text-[var(--andromeda-text-primary)]">
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
          <div className="text-[var(--andromeda-text-primary)]">{children}</div>
        </div>
      );
    },

    ...components,
  };
}
