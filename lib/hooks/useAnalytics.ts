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

function emit(name: string, data: object) {
  track(name, data as Record<string, string | number | boolean>);
}

export const useAnalytics = () => {
  const trackBusinessCardOpened = (data: BusinessCardOpenedEvent) => emit("business_card_opened", data);
  const trackProjectExpanded = (data: ProjectExpandedEvent) => emit("project_expanded", data);
  const trackProjectCaseStudyViewed = (data: ProjectCaseStudyViewedEvent) => emit("project_case_study_viewed", data);
  const trackCTAClicked = (data: CTAClickedEvent) => emit("cta_clicked", data);
  const trackPerspectivePostViewed = (data: PerspectivePostViewedEvent) => emit("perspective_post_viewed", data);
  const trackPerspectiveCategoryFiltered = (data: PerspectiveCategoryFilteredEvent) => emit("perspective_category_filtered", data);
  const trackThemeToggled = (data: ThemeToggledEvent) => emit("theme_toggled", data);
  const trackScreenshotLightboxOpened = (data: ScreenshotLightboxOpenedEvent) => emit("screenshot_lightbox_opened", data);
  const trackVideoPlayed = (data: VideoPlayedEvent) => emit("video_played", data);
  const trackProposalAccessed = (data: ProposalAccessedEvent) => emit("proposal_accessed", data);
  const trackProposalPackageSelected = (data: ProposalPackageSelectedEvent) => emit("proposal_package_selected", data);
  const trackProposalPaymentPlanSelected = (data: ProposalPaymentPlanSelectedEvent) => emit("proposal_payment_plan_selected", data);
  const trackProposalResponseSubmitted = (data: ProposalResponseSubmittedEvent) => emit("proposal_response_submitted", data);
  const trackProposalAssetsOpened = (data: ProposalAssetsOpenedEvent) => emit("proposal_assets_opened", data);
  const trackProposalAssetItemToggled = (data: ProposalAssetItemToggledEvent) => emit("proposal_asset_item_toggled", data);
  const trackProposalUploadFolderOpened = (data: ProposalUploadFolderOpenedEvent) => emit("proposal_upload_folder_opened", data);

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
