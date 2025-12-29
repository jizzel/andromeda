import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";

const contentDirectory = path.join(process.cwd(), "content/writing");

export type PostCategory = "Systems Design" | "Monitoring" | "Automation" | "Research";

export interface WritingPost {
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
    "systems-design": "Systems Design",
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
): WritingPost {
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
 * Get all writing posts sorted by date (newest first)
 */
export function getAllPosts(): WritingPost[] {
  const files = getAllMDXFiles();

  const posts = files.map(({ categoryFolder, fileName }) =>
    parseMDXFile(categoryFolder, fileName, false)
  );

  // Sort by publishedAt date, newest first
  return posts.sort((a, b) => {
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
}

/**
 * Get posts filtered by category
 */
export function getPostsByCategory(category: PostCategory): WritingPost[] {
  const allPosts = getAllPosts();
  return allPosts.filter((post) => post.category === category);
}

/**
 * Get a single post by slug
 */
export function getPostBySlug(slug: string): WritingPost | null {
  const files = getAllMDXFiles();

  for (const { categoryFolder, fileName } of files) {
    const fileSlug = fileName.replace(/\.mdx$/, "");
    if (fileSlug === slug) {
      return parseMDXFile(categoryFolder, fileName, true);
    }
  }

  return null;
}

/**
 * Get all unique categories
 */
export function getAllCategories(): PostCategory[] {
  const categories = getCategoryDirectories();
  return categories.map(categoryFolderToName);
}

/**
 * Get all unique tags
 */
export function getAllTags(): string[] {
  const posts = getAllPosts();
  const tags = new Set<string>();

  posts.forEach((post) => {
    post.tags.forEach((tag) => tags.add(tag));
  });

  return Array.from(tags).sort();
}

/**
 * Get related posts based on category and tags
 */
export function getRelatedPosts(slug: string, limit = 3): WritingPost[] {
  const currentPost = getPostBySlug(slug);
  if (!currentPost) return [];

  const allPosts = getAllPosts().filter((post) => post.slug !== slug);

  // Score posts based on shared category and tags
  const scoredPosts = allPosts.map((post) => {
    let score = 0;

    // Same category: +10 points
    if (post.category === currentPost.category) {
      score += 10;
    }

    // Shared tags: +1 point per tag
    const sharedTags = post.tags.filter((tag) =>
      currentPost.tags.includes(tag)
    );
    score += sharedTags.length;

    return { post, score };
  });

  // Sort by score and return top N
  return scoredPosts
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ post }) => post);
}
