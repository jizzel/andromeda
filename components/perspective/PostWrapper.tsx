"use client";

import { useEffect } from "react";
import { useAnalytics } from "@/lib/hooks/useAnalytics";

interface PostWrapperProps {
  slug: string;
  category: string;
  readTime: number;
  children: React.ReactNode;
}

export function PostWrapper({ slug, category, readTime, children }: PostWrapperProps) {
  const { trackPerspectivePostViewed } = useAnalytics();

  useEffect(() => {
    trackPerspectivePostViewed({
      post_slug: slug,
      category: category,
      read_time: readTime,
    });
  }, [slug, category, readTime, trackPerspectivePostViewed]);

  return <>{children}</>;
}
