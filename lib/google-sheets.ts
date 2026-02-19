import { google } from "googleapis";
import { unstable_cache } from "next/cache";
import type { ProposalData } from "@/types/proposal";

// Re-declare types here to avoid circular dependency with lib/content
type PostCategory = "System Design" | "Monitoring" | "Automation" | "Research";

interface SheetBlogPost {
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: string;
  category: PostCategory;
  readTime: number;
  tags: string[];
  content?: string;
}

// Initialize Google Sheets API client
function getGoogleSheetsClient() {
  const credentials = {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  };

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  return google.sheets({ version: "v4", auth });
}

const SPREADSHEET_ID = process.env.GOOGLE_PROPOSALS_SHEET_ID;
const SHEET_NAME = "Proposals";
const BLOG_SHEET_NAME = "BlogPosts";

// Column mapping for the Google Sheet
// Expected columns: id, accessCode, expiryDate, isActive, data (JSON string)
const COLUMNS = {
  ID: 0,
  ACCESS_CODE: 1,
  EXPIRY_DATE: 2,
  IS_ACTIVE: 3,
  DATA: 4, // JSON string containing full ProposalData
};

export interface ProposalRecord {
  id: string;
  accessCode: string;
  expiryDate: string;
  isActive: boolean;
  data: ProposalData;
}

/**
 * Fetch all proposals from Google Sheets
 */
export async function getAllProposals(): Promise<ProposalRecord[]> {
  const sheets = getGoogleSheetsClient();

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A2:E`, // Skip header row
  });

  const rows = response.data.values || [];

  return rows
    .map((row) => {
      if (row.length < 5) return null;
      try {
        return {
          id: row[COLUMNS.ID]?.trim(),
          accessCode: row[COLUMNS.ACCESS_CODE]?.trim(),
          expiryDate: row[COLUMNS.EXPIRY_DATE]?.trim(),
          isActive: row[COLUMNS.IS_ACTIVE]?.trim().toLowerCase() === "true",
          data: JSON.parse(row[COLUMNS.DATA]) as ProposalData,
        };
      } catch (error) {
        console.error(`Failed to parse proposal data for row with ID ${row[COLUMNS.ID]}:`, error);
        return null;
      }
    })
    .filter((p): p is ProposalRecord => p !== null);
}

/**
 * Find a proposal by its ID
 */
export async function getProposalById(
  proposalId: string
): Promise<ProposalRecord | null> {
  const proposals = await getAllProposals();
  return proposals.find((p) => p.id === proposalId) || null;
}

/**
 * Verify access code for a proposal
 * Returns the proposal data if valid, null otherwise
 */
export async function verifyProposalAccess(
  proposalId: string,
  accessCode: string
): Promise<{ success: boolean; proposal?: ProposalData; error?: string }> {
  try {
    const proposal = await getProposalById(proposalId);

    if (!proposal) {
      return { success: false, error: "Proposal not found" };
    }

    if (!proposal.isActive) {
      return { success: false, error: "This proposal is no longer available" };
    }

    // Check expiry date
    const expiryDate = new Date(proposal.expiryDate);
    const now = new Date();
    if (now > expiryDate) {
      return { success: false, error: "This proposal has expired" };
    }

    // Verify access code (case-insensitive comparison)
    if (proposal.accessCode.toLowerCase() !== accessCode.toLowerCase()) {
      return { success: false, error: "Invalid access code" };
    }

    return { success: true, proposal: proposal.data };
  } catch (error) {
    console.error("Error verifying proposal access:", error);
    return { success: false, error: "Unable to verify access. Please try again." };
  }
}

// Blog Posts from Google Sheets
const BLOG_COLUMNS = {
  SLUG: 0,
  TITLE: 1,
  EXCERPT: 2,
  PUBLISHED_AT: 3,
  CATEGORY: 4,
  TAGS: 5,
  IS_PUBLISHED: 6,
  CONTENT: 7,
};

/**
 * Fetch all published blog posts from Google Sheets (raw, uncached)
 */
async function fetchAllBlogPosts(): Promise<SheetBlogPost[]> {
  try {
    const sheets = getGoogleSheetsClient();

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${BLOG_SHEET_NAME}!A2:H`,
    });

    const rows = response.data.values || [];

    return rows
      .filter((row) => row[BLOG_COLUMNS.IS_PUBLISHED]?.trim().toLowerCase() === "true")
      .map((row) => ({
        slug: row[BLOG_COLUMNS.SLUG]?.trim() || "",
        title: row[BLOG_COLUMNS.TITLE]?.trim() || "",
        excerpt: row[BLOG_COLUMNS.EXCERPT]?.trim() || "",
        publishedAt: row[BLOG_COLUMNS.PUBLISHED_AT]?.trim() || "",
        category: (row[BLOG_COLUMNS.CATEGORY]?.trim() || "Research") as PostCategory,
        tags: row[BLOG_COLUMNS.TAGS]
          ? row[BLOG_COLUMNS.TAGS].split(",").map((t: string) => t.trim()).filter(Boolean)
          : [],
        readTime: 0, // Calculated by content.ts
        content: row[BLOG_COLUMNS.CONTENT] || "",
      }))
      .filter((post) => post.slug && post.title);
  } catch (error) {
    console.error("Failed to fetch blog posts from Google Sheets:", error);
    return [];
  }
}

/**
 * Fetch all published blog posts from Google Sheets (cached for 1 hour)
 */
export const getAllBlogPosts = unstable_cache(
  fetchAllBlogPosts,
  ["blog-posts"],
  { revalidate: 3600 }
);

/**
 * Fetch a single blog post by slug from Google Sheets
 */
export async function getBlogPostBySlug(slug: string): Promise<SheetBlogPost | null> {
  const posts = await getAllBlogPosts();
  return posts.find((p) => p.slug === slug) || null;
}

