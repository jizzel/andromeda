import { getAllPosts } from "@/lib/content";
import { profile } from "@/constants/profile";

export async function GET() {
  const posts = await getAllPosts();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://attakorah.com";

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${profile.surname} - Writing</title>
    <link>${siteUrl}/writing</link>
    <description>Thoughts on system design, monitoring, automation, and building reliable software.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${siteUrl}/writing/rss.xml" rel="self" type="application/rss+xml"/>
    ${posts
      .map(
        (post) => `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${siteUrl}/writing/${post.slug}</link>
      <guid isPermaLink="true">${siteUrl}/writing/${post.slug}</guid>
      <description>${escapeXml(post.excerpt)}</description>
      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
      <category>${escapeXml(post.category)}</category>
      ${post.tags.map((tag) => `<category>${escapeXml(tag)}</category>`).join("\n      ")}
    </item>`
      )
      .join("")}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
