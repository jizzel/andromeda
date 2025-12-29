import { getAllPosts, getAllCategories } from "@/lib/content";
import { WritingContent } from "@/components/writing/WritingContent";

export default function WritingPage() {
  const allPosts = getAllPosts();
  const categories = getAllCategories();

  return <WritingContent posts={allPosts} categories={categories} />;
}
