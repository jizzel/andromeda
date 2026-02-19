import { ImageResponse } from "next/og";
import { getPostBySlug } from "@/lib/content";
import { profile } from "@/constants/profile";

export const runtime = "nodejs";
export const alt = "Blog post";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return new ImageResponse(
      (
        <div
          style={{
            height: "100%",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0F111A",
            color: "#E5E5E5",
            fontSize: 48,
          }}
        >
          Post Not Found
        </div>
      ),
      { ...size }
    );
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: "#0F111A",
          backgroundImage:
            "radial-gradient(circle at 25px 25px, #1B1E2B 2%, transparent 0%), radial-gradient(circle at 75px 75px, #1B1E2B 2%, transparent 0%)",
          backgroundSize: "100px 100px",
          padding: "60px 80px",
        }}
      >
        {/* Category badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
          }}
        >
          <div
            style={{
              fontSize: 22,
              color: "#F5EBDD",
              backgroundColor: "rgba(245, 235, 221, 0.12)",
              padding: "8px 20px",
              borderRadius: 8,
              fontWeight: 600,
            }}
          >
            {post.category}
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div
            style={{
              fontSize: 56,
              fontWeight: 700,
              color: "#E5E5E5",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              maxWidth: "1000px",
            }}
          >
            {post.title.length > 80 ? post.title.slice(0, 77) + "..." : post.title}
          </div>
          <div
            style={{
              fontSize: 26,
              color: "#A0A0A0",
              lineHeight: 1.4,
              maxWidth: "900px",
            }}
          >
            {post.excerpt.length > 120 ? post.excerpt.slice(0, 117) + "..." : post.excerpt}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontSize: 22,
              color: "#A0A0A0",
            }}
          >
            <span style={{ color: "#E5E5E5", fontWeight: 600 }}>{profile.name}</span>
          </div>
          <div
            style={{
              display: "flex",
              gap: 24,
              fontSize: 20,
              color: "#A0A0A0",
            }}
          >
            <span>{post.readTime} min read</span>
            <span>{new Date(post.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
