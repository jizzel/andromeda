import { getAllPosts, getAllCategories } from "@/lib/content";
import { PerspectiveContent } from "@/components/perspective/PerspectiveContent";

export const revalidate = 3600;

export default async function PerspectivePage() {
  const allPosts = await getAllPosts();
  const categories = await getAllCategories();

  return <PerspectiveContent posts={allPosts} categories={categories} />;
}
