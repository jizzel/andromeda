"use client";

import { track } from "@vercel/analytics";

/**
 * Analytics event tracking utility
 *
 * Events:
 * - business_card_opened: When business card modal is opened
 * - project_expanded: When a project card is expanded
 * - project_case_study_viewed: When viewing a project case study page
 * - cta_clicked: When a CTA button is clicked
 * - writing_post_viewed: When viewing a blog post
 * - writing_category_filtered: When filtering blog posts by category
 * - theme_toggled: When theme is switched
 * - screenshot_lightbox_opened: When opening screenshot lightbox
 * - video_played: When playing a project video
 */

interface BusinessCardOpenedEvent {
  source: "hero" | "floating_button";
}

interface ProjectExpandedEvent {
  project_id: string;
  project_name: string;
  is_expansion_layer: boolean;
}

interface ProjectCaseStudyViewedEvent {
  project_slug: string;
  entry_point: string;
}

interface CTAClickedEvent {
  type: "calendly" | "email" | "github" | "linkedin";
  location: string;
}

interface WritingPostViewedEvent {
  post_slug: string;
  category: string;
  read_time: number;
}

interface WritingCategoryFilteredEvent {
  category: string;
}

interface ThemeToggledEvent {
  from: "dark" | "light";
  to: "dark" | "light";
  method: "button" | "system";
}

interface ScreenshotLightboxOpenedEvent {
  project_slug: string;
  screenshot_index: number;
}

interface VideoPlayedEvent {
  project_slug: string;
}

export const useAnalytics = () => {
  const trackBusinessCardOpened = (data: BusinessCardOpenedEvent) => {
    track("business_card_opened", data as unknown as Record<string, string | number | boolean>);
  };

  const trackProjectExpanded = (data: ProjectExpandedEvent) => {
    track("project_expanded", data as unknown as Record<string, string | number | boolean>);
  };

  const trackProjectCaseStudyViewed = (data: ProjectCaseStudyViewedEvent) => {
    track("project_case_study_viewed", data as unknown as Record<string, string | number | boolean>);
  };

  const trackCTAClicked = (data: CTAClickedEvent) => {
    track("cta_clicked", data as unknown as Record<string, string | number | boolean>);
  };

  const trackWritingPostViewed = (data: WritingPostViewedEvent) => {
    track("writing_post_viewed", data as unknown as Record<string, string | number | boolean>);
  };

  const trackWritingCategoryFiltered = (data: WritingCategoryFilteredEvent) => {
    track("writing_category_filtered", data as unknown as Record<string, string | number | boolean>);
  };

  const trackThemeToggled = (data: ThemeToggledEvent) => {
    track("theme_toggled", data as unknown as Record<string, string | number | boolean>);
  };

  const trackScreenshotLightboxOpened = (data: ScreenshotLightboxOpenedEvent) => {
    track("screenshot_lightbox_opened", data as unknown as Record<string, string | number | boolean>);
  };

  const trackVideoPlayed = (data: VideoPlayedEvent) => {
    track("video_played", data as unknown as Record<string, string | number | boolean>);
  };

  return {
    trackBusinessCardOpened,
    trackProjectExpanded,
    trackProjectCaseStudyViewed,
    trackCTAClicked,
    trackWritingPostViewed,
    trackWritingCategoryFiltered,
    trackThemeToggled,
    trackScreenshotLightboxOpened,
    trackVideoPlayed,
  };
};
