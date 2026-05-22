import { google } from "googleapis";
import { unstable_cache } from "next/cache";
import type {
  ProposalData,
  ProposalAcceptance,
  AcceptanceStatus,
  TrackerMilestoneState,
  TrackerStatus,
} from "@/types/proposal";
import type { CreativeBriefData } from "@/types/brief";

// Re-declare types here to avoid circular dependency with lib/content
type PostCategory = "System Design" | "Monitoring" | "Automation" | "Research";

const VALID_CATEGORIES: readonly PostCategory[] = ["System Design", "Monitoring", "Automation", "Research"];

function validateCategory(value: string | undefined): PostCategory {
  const trimmed = value?.trim() || "";
  if (VALID_CATEGORIES.includes(trimmed as PostCategory)) {
    return trimmed as PostCategory;
  }
  return "Research";
}

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
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
}

const SPREADSHEET_ID = process.env.GOOGLE_PROPOSALS_SHEET_ID;
const SHEET_NAME = "Proposals";
const BRIEF_SHEET_NAME = "CreativeBrief";
const BLOG_SHEET_NAME = "BlogPosts";

// Column mapping for access-gated sheet rows (Proposals + CreativeBrief share this shape).
// Expected columns: id, accessCode, expiryDate, isActive, data (JSON string)
const COLUMNS = {
  ID: 0,
  ACCESS_CODE: 1,
  EXPIRY_DATE: 2,
  IS_ACTIVE: 3,
  DATA: 4,
};

export interface AccessGatedRecord<T> {
  id: string;
  accessCode: string;
  expiryDate: string;
  isActive: boolean;
  data: T;
}

export type ProposalRecord = AccessGatedRecord<ProposalData>;
export type BriefRecord = AccessGatedRecord<CreativeBriefData>;

// Generic copy used by the verify wrappers below. The "noun" lets each surface
// (proposal / brief / future) produce error messages clients can act on.
interface AccessVerifyMessages {
  notFound: string;
  inactive: string;
  expired: string;
}

/**
 * Fetch all access-gated rows from a sheet tab whose columns match the shape
 * `id | accessCode | expiryDate | isActive | data(JSON)`.
 */
async function fetchAccessGatedRows<T>(sheetName: string): Promise<AccessGatedRecord<T>[]> {
  const sheets = getGoogleSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A2:E`,
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
          data: JSON.parse(row[COLUMNS.DATA]) as T,
        } satisfies AccessGatedRecord<T>;
      } catch (error) {
        console.error(`Failed to parse data for ${sheetName} row with ID ${row[COLUMNS.ID]}:`, error);
        return null;
      }
    })
    .filter((r): r is AccessGatedRecord<T> => r !== null);
}

async function findAccessGatedRecordById<T>(
  sheetName: string,
  id: string
): Promise<AccessGatedRecord<T> | null> {
  const all = await fetchAccessGatedRows<T>(sheetName);
  return all.find((r) => r.id === id) || null;
}

async function verifyAccessGated<T>(
  sheetName: string,
  id: string,
  accessCode: string,
  messages: AccessVerifyMessages
): Promise<{ success: true; data: T; expiryDate: string } | { success: false; error: string }> {
  try {
    const record = await findAccessGatedRecordById<T>(sheetName, id);
    if (!record) return { success: false, error: messages.notFound };
    if (!record.isActive) return { success: false, error: messages.inactive };

    // Fail closed on unparseable expiry dates: a malformed cell is a data
    // integrity problem, not a "the row never expires" signal. Treat invalid
    // dates as expired so the access is denied rather than silently granted.
    const expiryDate = new Date(record.expiryDate);
    if (isNaN(expiryDate.getTime()) || new Date() > expiryDate) {
      return { success: false, error: messages.expired };
    }

    if (record.accessCode.toLowerCase() !== accessCode.toLowerCase()) {
      return { success: false, error: "Invalid access code" };
    }

    return { success: true, data: record.data, expiryDate: record.expiryDate };
  } catch (error) {
    console.error(`Error verifying ${sheetName} access:`, error);
    return { success: false, error: "Unable to verify access. Please try again." };
  }
}

/**
 * Fetch all proposals from Google Sheets
 */
export async function getAllProposals(): Promise<ProposalRecord[]> {
  return fetchAccessGatedRows<ProposalData>(SHEET_NAME);
}

/**
 * Find a proposal by its ID
 */
export async function getProposalById(
  proposalId: string
): Promise<ProposalRecord | null> {
  return findAccessGatedRecordById<ProposalData>(SHEET_NAME, proposalId);
}

/**
 * Verify access code for a proposal
 */
export async function verifyProposalAccess(
  proposalId: string,
  accessCode: string
): Promise<{ success: boolean; proposal?: ProposalData; expiryDate?: string; error?: string }> {
  const result = await verifyAccessGated<ProposalData>(SHEET_NAME, proposalId, accessCode, {
    notFound: "Proposal not found",
    inactive: "This proposal is no longer available",
    expired: "This proposal has expired",
  });
  if (!result.success) return { success: false, error: result.error };
  return { success: true, proposal: result.data, expiryDate: result.expiryDate };
}

/**
 * Find a creative brief by its ID
 */
export async function getBriefById(briefId: string): Promise<BriefRecord | null> {
  return findAccessGatedRecordById<CreativeBriefData>(BRIEF_SHEET_NAME, briefId);
}

/**
 * Verify access code for a creative brief
 */
export async function verifyBriefAccess(
  briefId: string,
  accessCode: string
): Promise<{ success: boolean; brief?: CreativeBriefData; expiryDate?: string; error?: string }> {
  const result = await verifyAccessGated<CreativeBriefData>(BRIEF_SHEET_NAME, briefId, accessCode, {
    notFound: "Brief not found",
    inactive: "This brief is no longer available",
    expired: "This brief has expired",
  });
  if (!result.success) return { success: false, error: result.error };
  return { success: true, brief: result.data, expiryDate: result.expiryDate };
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
        category: validateCategory(row[BLOG_COLUMNS.CATEGORY]),
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

// Asset checklist — stored in "ProposalAssets" tab
// Columns: A: proposalId | B: itemId | C: checked | D: checkedAt
const ASSETS_SHEET_NAME = "ProposalAssets";

// Acceptance — stored in "ProposalAcceptance" tab
// Columns: A: proposalId | B: status | C: counterNote | D: acceptedAt
const ACCEPTANCE_SHEET_NAME = "ProposalAcceptance";

export async function getCheckedAssetItems(proposalId: string): Promise<string[]> {
  try {
    const sheets = getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${ASSETS_SHEET_NAME}!A2:D`,
    });
    const rows = response.data.values || [];
    return rows
      .filter((row) => row[0]?.trim() === proposalId && row[2]?.trim().toLowerCase() === "true")
      .map((row) => row[1]?.trim())
      .filter(Boolean);
  } catch (error) {
    console.error("Failed to fetch asset checklist:", error);
    return [];
  }
}

async function getSheetId(
  sheets: ReturnType<typeof getGoogleSheetsClient>,
  tabName: string,
  cache: { value: number | null }
): Promise<number | null> {
  if (cache.value !== null) return cache.value;
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const sheet = meta.data.sheets?.find((s) => s.properties?.title === tabName);
  const id = sheet?.properties?.sheetId ?? null;
  if (id !== null) cache.value = id;
  return id;
}

const assetsSheetIdCache = { value: null as number | null };
async function getAssetsSheetId(sheets: ReturnType<typeof getGoogleSheetsClient>): Promise<number | null> {
  return getSheetId(sheets, ASSETS_SHEET_NAME, assetsSheetIdCache);
}

export async function setAssetItemChecked(
  proposalId: string,
  itemId: string,
  checked: boolean
): Promise<void> {
  const sheets = getGoogleSheetsClient();

  // Read existing rows first to prevent duplicates and handle idempotency
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${ASSETS_SHEET_NAME}!A2:B`,
  });
  const rows = response.data.values || [];
  const rowIndex = rows.findIndex(
    (row) => row[0]?.trim() === proposalId && row[1]?.trim() === itemId
  );

  if (checked) {
    if (rowIndex !== -1) return; // Already exists — skip to avoid duplicates
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${ASSETS_SHEET_NAME}!A:D`,
      valueInputOption: "RAW",
      requestBody: {
        values: [[proposalId, itemId, "true", new Date().toISOString()]],
      },
    });
  } else {
    if (rowIndex === -1) return; // Already gone — nothing to delete

    const sheetId = await getAssetsSheetId(sheets);
    if (sheetId === null) return;

    const sheetRowIndex = rowIndex + 2; // +1 for 0-based index, +1 for header row
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: "ROWS",
                startIndex: sheetRowIndex - 1,
                endIndex: sheetRowIndex,
              },
            },
          },
        ],
      },
    });
  }
}

// Proposal acceptance — read/write "ProposalAcceptance" tab

// ProposalAcceptance sheet columns: A:proposalId | B:status | C:counterNote | D:acceptedAt | E:packageId | F:paymentPlanId

export async function getProposalAcceptance(proposalId: string): Promise<ProposalAcceptance | null> {
  try {
    const sheets = getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${ACCEPTANCE_SHEET_NAME}!A2:F`,
    });
    const rows = response.data.values || [];
    const row = rows.find((r) => r[0]?.trim() === proposalId);
    if (!row) return null;
    return {
      status: (row[1]?.trim() || "pending") as AcceptanceStatus,
      counterNote: row[2]?.trim() || undefined,
      acceptedAt: row[3]?.trim() || "",
      packageId: row[4]?.trim() || undefined,
      paymentPlanId: row[5]?.trim() || undefined,
    };
  } catch (error) {
    console.error("Failed to fetch proposal acceptance:", error);
    return null;
  }
}

const acceptanceSheetIdCache = { value: null as number | null };

export async function setProposalAcceptance(
  proposalId: string,
  acceptance: Omit<ProposalAcceptance, "acceptedAt">
): Promise<void> {
  const sheets = getGoogleSheetsClient();
  const acceptedAt = new Date().toISOString();
  const row = [
    proposalId,
    acceptance.status,
    acceptance.counterNote ?? "",
    acceptedAt,
    acceptance.packageId ?? "",
    acceptance.paymentPlanId ?? "",
  ];

  // Check if a row already exists for this proposal
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${ACCEPTANCE_SHEET_NAME}!A2:A`,
  });
  const rows = response.data.values || [];
  const rowIndex = rows.findIndex((r) => r[0]?.trim() === proposalId);

  if (rowIndex === -1) {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${ACCEPTANCE_SHEET_NAME}!A:F`,
      valueInputOption: "RAW",
      requestBody: { values: [row] },
    });
  } else {
    const sheetRow = rowIndex + 2;
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${ACCEPTANCE_SHEET_NAME}!A${sheetRow}:F${sheetRow}`,
      valueInputOption: "RAW",
      requestBody: { values: [row] },
    });
  }
}

export async function getAcceptanceSheetId(
  sheets: ReturnType<typeof getGoogleSheetsClient>
): Promise<number | null> {
  return getSheetId(sheets, ACCEPTANCE_SHEET_NAME, acceptanceSheetIdCache);
}

// Project tracker — stored in "ProjectTracker" tab
// Columns: A: proposalId | B: phaseId | C: milestoneId | D: status |
//          E: startedAt | F: completedAt | G: note | H: updatedAt | I: notifiedAt
const TRACKER_SHEET_NAME = "ProjectTracker";
const TRACKER_VALID_STATUSES: readonly TrackerStatus[] = ["pending", "in_progress", "done", "blocked"];

const trackerSheetIdCache = { value: null as number | null };

function rowToTrackerState(row: string[]): TrackerMilestoneState {
  const rawStatus = row[3]?.trim() || "pending";
  const status = (TRACKER_VALID_STATUSES as readonly string[]).includes(rawStatus)
    ? (rawStatus as TrackerStatus)
    : "pending";
  return {
    phaseId: row[1]?.trim() || "",
    milestoneId: row[2]?.trim() || "",
    status,
    startedAt: row[4]?.trim() || undefined,
    completedAt: row[5]?.trim() || undefined,
    note: row[6]?.trim() || undefined,
    updatedAt: row[7]?.trim() || "",
  };
}

function trackerStateToRow(proposalId: string, state: TrackerMilestoneState, notifiedAt = ""): string[] {
  return [
    proposalId,
    state.phaseId,
    state.milestoneId,
    state.status,
    state.startedAt ?? "",
    state.completedAt ?? "",
    state.note ?? "",
    state.updatedAt,
    notifiedAt,
  ];
}

export async function getTrackerStates(proposalId: string): Promise<TrackerMilestoneState[]> {
  try {
    const sheets = getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${TRACKER_SHEET_NAME}!A2:I`,
    });
    const rows = response.data.values || [];
    return rows
      .filter((row) => row[0]?.trim() === proposalId)
      .map(rowToTrackerState)
      .filter((s) => s.phaseId && s.milestoneId);
  } catch (error) {
    console.error("Failed to fetch tracker states:", error);
    return [];
  }
}

/**
 * Fetch all tracker states in one sheet read, grouped by proposalId. Use this
 * when you'd otherwise call `getTrackerStates` for many proposals in a loop
 * (e.g. the weekly-update cron).
 */
export async function getAllTrackerStatesByProposal(): Promise<Map<string, TrackerMilestoneState[]>> {
  const out = new Map<string, TrackerMilestoneState[]>();
  try {
    const sheets = getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${TRACKER_SHEET_NAME}!A2:I`,
    });
    const rows = response.data.values || [];
    for (const row of rows) {
      const proposalId = row[0]?.trim();
      if (!proposalId) continue;
      const state = rowToTrackerState(row);
      if (!state.phaseId || !state.milestoneId) continue;
      const existing = out.get(proposalId);
      if (existing) existing.push(state);
      else out.set(proposalId, [state]);
    }
  } catch (error) {
    console.error("Failed to fetch all tracker states:", error);
  }
  return out;
}

export async function getTrackerRow(
  proposalId: string,
  phaseId: string,
  milestoneId: string
): Promise<{ rowIndex: number; state: TrackerMilestoneState; notifiedAt: string } | null> {
  const sheets = getGoogleSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${TRACKER_SHEET_NAME}!A2:I`,
  });
  const rows = response.data.values || [];
  const idx = rows.findIndex(
    (row) =>
      row[0]?.trim() === proposalId &&
      row[1]?.trim() === phaseId &&
      row[2]?.trim() === milestoneId
  );
  if (idx === -1) return null;
  return {
    rowIndex: idx + 2,
    state: rowToTrackerState(rows[idx]),
    notifiedAt: rows[idx][8]?.trim() || "",
  };
}

export async function appendTrackerRows(
  proposalId: string,
  states: TrackerMilestoneState[]
): Promise<void> {
  if (states.length === 0) return;
  const sheets = getGoogleSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${TRACKER_SHEET_NAME}!A:I`,
    valueInputOption: "RAW",
    requestBody: {
      values: states.map((s) => trackerStateToRow(proposalId, s)),
    },
  });
}

export async function setTrackerMilestone(
  proposalId: string,
  phaseId: string,
  milestoneId: string,
  patch: Partial<Pick<TrackerMilestoneState, "status" | "startedAt" | "completedAt" | "note">>
): Promise<void> {
  const sheets = getGoogleSheetsClient();
  const existing = await getTrackerRow(proposalId, phaseId, milestoneId);
  const now = new Date().toISOString();

  const merged: TrackerMilestoneState = {
    phaseId,
    milestoneId,
    status: patch.status ?? existing?.state.status ?? "pending",
    startedAt: patch.startedAt ?? existing?.state.startedAt,
    completedAt: patch.completedAt ?? existing?.state.completedAt,
    note: patch.note !== undefined ? patch.note : existing?.state.note,
    updatedAt: now,
  };

  // Auto-stamp completedAt when transitioning into done
  if (merged.status === "done" && existing?.state.status !== "done" && !merged.completedAt) {
    merged.completedAt = now;
  }

  if (existing) {
    // Preserve notifiedAt unless the row is no longer "done" (then clear it so a re-completion re-notifies)
    const preservedNotifiedAt = merged.status === "done" ? existing.notifiedAt : "";
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${TRACKER_SHEET_NAME}!A${existing.rowIndex}:I${existing.rowIndex}`,
      valueInputOption: "RAW",
      requestBody: {
        values: [trackerStateToRow(proposalId, merged, preservedNotifiedAt)],
      },
    });
  } else {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${TRACKER_SHEET_NAME}!A:I`,
      valueInputOption: "RAW",
      requestBody: {
        values: [trackerStateToRow(proposalId, merged)],
      },
    });
  }
}

export async function markTrackerNotified(
  proposalId: string,
  phaseId: string,
  milestoneId: string
): Promise<void> {
  const sheets = getGoogleSheetsClient();
  const existing = await getTrackerRow(proposalId, phaseId, milestoneId);
  if (!existing) return;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${TRACKER_SHEET_NAME}!I${existing.rowIndex}`,
    valueInputOption: "RAW",
    requestBody: { values: [[new Date().toISOString()]] },
  });
}

export async function getTrackerSheetId(
  sheets: ReturnType<typeof getGoogleSheetsClient>
): Promise<number | null> {
  return getSheetId(sheets, TRACKER_SHEET_NAME, trackerSheetIdCache);
}

// Weekly update tabs.
// WeeklyNotes columns: A: proposalId | B: weekEndingDate (YYYY-MM-DD) | C: note
// WeeklyUpdatesSent columns: A: proposalId | B: weekEndingDate | C: sentAt
const WEEKLY_NOTES_SHEET_NAME = "WeeklyNotes";
const WEEKLY_SENT_SHEET_NAME = "WeeklyUpdatesSent";

/**
 * Returns the weekly note for a given proposal and week-ending date, or null
 * if no row exists. `weekEndingDate` is a YYYY-MM-DD string.
 */
export async function getWeeklyNote(
  proposalId: string,
  weekEndingDate: string
): Promise<string | null> {
  try {
    const sheets = getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${WEEKLY_NOTES_SHEET_NAME}!A2:C`,
    });
    const rows = response.data.values || [];
    const row = rows.find(
      (r) => r[0]?.trim() === proposalId && r[1]?.trim() === weekEndingDate
    );
    const note = row?.[2]?.trim();
    return note || null;
  } catch (error) {
    console.error("Failed to fetch weekly note:", error);
    return null;
  }
}

/**
 * Returns true if a weekly update has already been sent for the given proposal + week.
 */
export async function hasWeeklyUpdateBeenSent(
  proposalId: string,
  weekEndingDate: string
): Promise<boolean> {
  try {
    const sheets = getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${WEEKLY_SENT_SHEET_NAME}!A2:C`,
    });
    const rows = response.data.values || [];
    return rows.some(
      (r) => r[0]?.trim() === proposalId && r[1]?.trim() === weekEndingDate
    );
  } catch (error) {
    // If the tab doesn't exist yet, treat as "not sent" so the first run can proceed.
    console.error("Failed to check weekly update sent state:", error);
    return false;
  }
}

/**
 * Append a row to WeeklyUpdatesSent marking that a weekly update has been delivered.
 */
export async function markWeeklyUpdateSent(
  proposalId: string,
  weekEndingDate: string
): Promise<void> {
  const sheets = getGoogleSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${WEEKLY_SENT_SHEET_NAME}!A:C`,
    valueInputOption: "RAW",
    requestBody: {
      values: [[proposalId, weekEndingDate, new Date().toISOString()]],
    },
  });
}

/**
 * Fetch all WeeklyNotes rows in one sheet read, keyed by `${proposalId}::${weekEndingDate}`.
 * Use this in the cron to avoid one network read per proposal.
 */
export async function getAllWeeklyNotes(): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  try {
    const sheets = getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${WEEKLY_NOTES_SHEET_NAME}!A2:C`,
    });
    const rows = response.data.values || [];
    for (const row of rows) {
      const proposalId = row[0]?.trim();
      const weekEndingDate = row[1]?.trim();
      const note = row[2]?.trim();
      if (proposalId && weekEndingDate && note) {
        out.set(`${proposalId}::${weekEndingDate}`, note);
      }
    }
  } catch (error) {
    // Missing tab is fine — empty map means "no notes anywhere."
    console.error("Failed to fetch weekly notes:", error);
  }
  return out;
}

/**
 * Fetch all WeeklyUpdatesSent rows in one sheet read, as a Set of
 * `${proposalId}::${weekEndingDate}` keys for fast membership checks.
 */
export async function getAllWeeklyUpdatesSent(): Promise<Set<string>> {
  const out = new Set<string>();
  try {
    const sheets = getGoogleSheetsClient();
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${WEEKLY_SENT_SHEET_NAME}!A2:C`,
    });
    const rows = response.data.values || [];
    for (const row of rows) {
      const proposalId = row[0]?.trim();
      const weekEndingDate = row[1]?.trim();
      if (proposalId && weekEndingDate) {
        out.add(`${proposalId}::${weekEndingDate}`);
      }
    }
  } catch (error) {
    // Missing tab → empty set → all proposals are "not sent yet." First run is fine.
    console.error("Failed to fetch weekly updates sent:", error);
  }
  return out;
}

