import { MetadataRoute } from "next";
import { profile } from "@/constants/profile";
import { getAllPosts } from "@/lib/content";
import { projectsDetail } from "@/constants/projects-detail";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${profile.siteUrl}/perspective/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const projectEntries: MetadataRoute.Sitemap = projectsDetail.map((project) => ({
    url: `${profile.siteUrl}/projects/${project.slug}`,
    lastModified: new Date(project.lastModified),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [
    {
      url: profile.siteUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
    {
      url: `${profile.siteUrl}/perspective`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...postEntries,
    ...projectEntries,
  ];
}
