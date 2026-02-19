import { MDXRemote } from "next-mdx-remote/rsc";
import { useMDXComponents } from "@/components/mdx/MDXComponents";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import remarkGfm from "remark-gfm";

interface MDXContentProps {
  content: string;
}

export async function MDXContent({ content }: MDXContentProps) {
  const components = useMDXComponents({});

  return (
    <MDXRemote
      source={content}
      components={components}
      options={{
        mdxOptions: {
          remarkPlugins: [remarkGfm],
          rehypePlugins: [
            rehypeHighlight,
            rehypeSlug,
            [
              rehypeAutolinkHeadings,
              {
                behavior: "wrap",
                properties: {
                  className: ["anchor"],
                },
              },
            ],
          ],
        },
      }}
    />
  );
}
