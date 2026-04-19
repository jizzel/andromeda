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
 * - perspective_post_viewed: When viewing a blog post
 * - perspective_category_filtered: When filtering blog posts by category
 * - theme_toggled: When theme is switched
 * - screenshot_lightbox_opened: When opening screenshot lightbox
 * - video_played: When playing a project video
 */

interface BusinessCardOpenedEvent {
  source: "hero" | "floating_button" | "identity_anchor";
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
  type: "calendly" | "email" | "github" | "linkedin" | "call" | "whatsapp" | "vcard" | "download";
  location: string;
}

interface ProposalAccessedEvent {
  proposal_id: string;
}

interface ProposalPackageSelectedEvent {
  proposal_id: string;
  package_id: string;
  package_name: string;
}

interface ProposalPaymentPlanSelectedEvent {
  proposal_id: string;
  plan_id: string;
  plan_name: string;
}

interface ProposalResponseSubmittedEvent {
  proposal_id: string;
  status: "accepted" | "counter";
  package_id?: string;
  payment_plan_id?: string;
}

interface ProposalAssetsOpenedEvent {
  proposal_id: string;
}

interface ProposalAssetItemToggledEvent {
  proposal_id: string;
  item_id: string;
  checked: boolean;
}

interface ProposalUploadFolderOpenedEvent {
  proposal_id: string;
}

interface PerspectivePostViewedEvent {
  post_slug: string;
  category: string;
  read_time: number;
}

interface PerspectiveCategoryFilteredEvent {
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

  const trackPerspectivePostViewed = (data: PerspectivePostViewedEvent) => {
    track("perspective_post_viewed", data as unknown as Record<string, string | number | boolean>);
  };

  const trackPerspectiveCategoryFiltered = (data: PerspectiveCategoryFilteredEvent) => {
    track("perspective_category_filtered", data as unknown as Record<string, string | number | boolean>);
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

  const trackProposalAccessed = (data: ProposalAccessedEvent) => {
    track("proposal_accessed", data as unknown as Record<string, string | number | boolean>);
  };

  const trackProposalPackageSelected = (data: ProposalPackageSelectedEvent) => {
    track("proposal_package_selected", data as unknown as Record<string, string | number | boolean>);
  };

  const trackProposalPaymentPlanSelected = (data: ProposalPaymentPlanSelectedEvent) => {
    track("proposal_payment_plan_selected", data as unknown as Record<string, string | number | boolean>);
  };

  const trackProposalResponseSubmitted = (data: ProposalResponseSubmittedEvent) => {
    track("proposal_response_submitted", data as unknown as Record<string, string | number | boolean>);
  };

  const trackProposalAssetsOpened = (data: ProposalAssetsOpenedEvent) => {
    track("proposal_assets_opened", data as unknown as Record<string, string | number | boolean>);
  };

  const trackProposalAssetItemToggled = (data: ProposalAssetItemToggledEvent) => {
    track("proposal_asset_item_toggled", data as unknown as Record<string, string | number | boolean>);
  };

  const trackProposalUploadFolderOpened = (data: ProposalUploadFolderOpenedEvent) => {
    track("proposal_upload_folder_opened", data as unknown as Record<string, string | number | boolean>);
  };

  return {
    trackBusinessCardOpened,
    trackProjectExpanded,
    trackProjectCaseStudyViewed,
    trackCTAClicked,
    trackPerspectivePostViewed,
    trackPerspectiveCategoryFiltered,
    trackThemeToggled,
    trackScreenshotLightboxOpened,
    trackVideoPlayed,
    trackProposalAccessed,
    trackProposalPackageSelected,
    trackProposalPaymentPlanSelected,
    trackProposalResponseSubmitted,
    trackProposalAssetsOpened,
    trackProposalAssetItemToggled,
    trackProposalUploadFolderOpened,
  };
};
