import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { getAllBlogPosts, getBlogPostBySlug } from "@/lib/google-sheets";

const contentDirectory = path.join(process.cwd(), "content/perspective");

export type PostCategory = "System Design" | "Monitoring" | "Automation" | "Research";

export interface PerspectivePost {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  category: PostCategory;
  readTime: number;
  tags: string[];
  content?: string;
}

/**
 * Get all category directories
 */
function getCategoryDirectories(): string[] {
  return fs.readdirSync(contentDirectory).filter((file) => {
    return fs.statSync(path.join(contentDirectory, file)).isDirectory();
  });
}

/**
 * Convert category folder name to display name
 */
function categoryFolderToName(folder: string): PostCategory {
  const mapping: Record<string, PostCategory> = {
    "system-design": "System Design",
    "monitoring": "Monitoring",
    "automation": "Automation",
    "research": "Research",
  };
  return mapping[folder] || (folder as PostCategory);
}

/**
 * Get all MDX files from all category directories
 */
function getAllMDXFiles(): Array<{ categoryFolder: string; fileName: string }> {
  const categories = getCategoryDirectories();
  const files: Array<{ categoryFolder: string; fileName: string }> = [];

  categories.forEach((category) => {
    const categoryPath = path.join(contentDirectory, category);
    const categoryFiles = fs
      .readdirSync(categoryPath)
      .filter((file) => file.endsWith(".mdx"));

    categoryFiles.forEach((file) => {
      files.push({ categoryFolder: category, fileName: file });
    });
  });

  return files;
}

/**
 * Parse MDX file and extract frontmatter
 */
function parseMDXFile(
  categoryFolder: string,
  fileName: string,
  includeContent = false
): PerspectivePost {
  const filePath = path.join(contentDirectory, categoryFolder, fileName);
  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);

  const slug = fileName.replace(/\.mdx$/, "");
  const stats = readingTime(content);

  return {
    slug,
    title: data.title,
    excerpt: data.excerpt,
    publishedAt: data.publishedAt,
    category: categoryFolderToName(categoryFolder),
    readTime: Math.ceil(stats.minutes),
    tags: data.tags || [],
    ...(includeContent && { content }),
  };
}

/**
 * Get all local MDX posts (sync helper)
 */
function getLocalPosts(includeContent = false): PerspectivePost[] {
  const files = getAllMDXFiles();
  return files.map(({ categoryFolder, fileName }) =>
    parseMDXFile(categoryFolder, fileName, includeContent)
  );
}

/**
 * Get all writing posts sorted by date (newest first)
 * Merges local MDX posts with Google Sheets posts
 */
export async function getAllPosts(): Promise<PerspectivePost[]> {
  const localPosts = getLocalPosts();
  const sheetPosts = await getAllBlogPosts();

  // Calculate readTime for sheet posts and strip content for listing
  const processedSheetPosts = sheetPosts.map((post) => {
    const stats = readingTime(post.content || "");
    return {
      ...post,
      readTime: Math.ceil(stats.minutes),
      content: undefined,
    };
  });

  const allPosts = [...localPosts, ...processedSheetPosts];

  return allPosts.sort((a, b) => {
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
}

/**
 * Get posts filtered by category
 */
export async function getPostsByCategory(category: PostCategory): Promise<PerspectivePost[]> {
  const allPosts = await getAllPosts();
  return allPosts.filter((post) => post.category === category);
}

/**
 * Get a single post by slug
 */
export async function getPostBySlug(slug: string): Promise<PerspectivePost | null> {
  // Try local MDX first
  const files = getAllMDXFiles();
  for (const { categoryFolder, fileName } of files) {
    const fileSlug = fileName.replace(/\.mdx$/, "");
    if (fileSlug === slug) {
      return parseMDXFile(categoryFolder, fileName, true);
    }
  }

  // Try Google Sheets
  const sheetPost = await getBlogPostBySlug(slug);
  if (sheetPost) {
    const stats = readingTime(sheetPost.content || "");
    return {
      ...sheetPost,
      readTime: Math.ceil(stats.minutes),
    };
  }

  return null;
}

/**
 * Get all unique categories
 */
export async function getAllCategories(): Promise<PostCategory[]> {
  const posts = await getAllPosts();
  const categories = new Set<PostCategory>();
  posts.forEach((post) => categories.add(post.category));
  return Array.from(categories);
}

/**
 * Get all unique tags
 */
export async function getAllTags(): Promise<string[]> {
  const posts = await getAllPosts();
  const tags = new Set<string>();

  posts.forEach((post) => {
    post.tags.forEach((tag) => tags.add(tag));
  });

  return Array.from(tags).sort();
}

/**
 * Get related posts based on category and tags
 */
export async function getRelatedPosts(slug: string, limit = 3): Promise<PerspectivePost[]> {
  const currentPost = await getPostBySlug(slug);
  if (!currentPost) return [];

  const allPosts = (await getAllPosts()).filter((post) => post.slug !== slug);

  const scoredPosts = allPosts.map((post) => {
    let score = 0;

    if (post.category === currentPost.category) {
      score += 10;
    }

    const sharedTags = post.tags.filter((tag) =>
      currentPost.tags.includes(tag)
    );
    score += sharedTags.length;

    return { post, score };
  });

  return scoredPosts
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ post }) => post);
}
