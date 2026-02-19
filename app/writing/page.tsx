import { getAllPosts, getAllCategories } from "@/lib/content";
import { WritingContent } from "@/components/writing/WritingContent";

export default async function WritingPage() {
  const allPosts = await getAllPosts();
  const categories = await getAllCategories();

  return <WritingContent posts={allPosts} categories={categories} />;
}
