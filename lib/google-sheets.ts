import { createHash, randomBytes } from "crypto";
import { google } from "googleapis";
import { instrumentSheets, noteLockHeld, onSheetsRetryAttempt } from "@/lib/sheets-telemetry";
import { unstable_cache } from "next/cache";
import type {
  ProposalData,
  ProposalAcceptance,
  AcceptanceStatus,
  TrackerMilestoneState,
  TrackerStatus,
} from "@/types/proposal";
import type { CreativeBriefData } from "@/types/brief";
import type { PublishedRevision } from "@/types/proposal";
import type { AgreementRecord } from "@/types/agreement";

export type { PublishedRevision };

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
/**
 * One Sheets client (and auth object) per server instance, created on first
 * use. Reusing it keeps the auth library's cached access token across calls
 * instead of setting up a new client and token for every helper — Google's
 * recommended practice for client libraries. Wrapped by `instrumentSheets` so
 * slow calls and retries are logged (`lib/sheets-telemetry.ts`).
 */
let sheetsClient: ReturnType<typeof google.sheets> | null = null;

/**
 * How the app's Sheets client is built (instrumented, retry hook attached).
 * `overrides` exist for tests that point it at a local stub server; the app
 * always uses the defaults.
 */
export function createSheetsClient(overrides: { rootUrl?: string; auth?: string } = {}) {
  const auth =
    overrides.auth ??
    new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
  // Retries stay on (googleapis' defaults: GET/PUT…, 429 and 5xx, 3 attempts with
  // backoff); the hook only makes them visible. Per-call options — e.g. the
  // write timeout under a sheet lock — still merge on top of these.
  return instrumentSheets(
    google.sheets({ version: "v4", auth, ...(overrides.rootUrl && { rootUrl: overrides.rootUrl }), retryConfig: { onRetryAttempt: onSheetsRetryAttempt } })
  );
}

function getGoogleSheetsClient() {
  sheetsClient ??= createSheetsClient();
  return sheetsClient;
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
  messages: AccessVerifyMessages,
  /**
   * Called only when the row's expiry date has passed (and the access code
   * matched). Returning true grants access anyway. Used to keep accepted
   * engagements reachable after the proposal offer window closes.
   */
  allowPastExpiry?: () => Promise<boolean>
): Promise<{ success: true; data: T; expiryDate: string } | { success: false; error: string }> {
  try {
    const record = await findAccessGatedRecordById<T>(sheetName, id);
    if (!record) return { success: false, error: messages.notFound };
    if (!record.isActive) return { success: false, error: messages.inactive };

    // Fail closed on unparseable expiry dates: a malformed cell is a data
    // integrity problem, not a "the row never expires" signal. Treat invalid
    // dates as expired so the access is denied rather than silently granted —
    // `allowPastExpiry` does not rescue a malformed date.
    const expiryDate = new Date(record.expiryDate);
    if (isNaN(expiryDate.getTime())) {
      return { success: false, error: messages.expired };
    }
    const pastExpiry = new Date() > expiryDate;
    if (pastExpiry && !allowPastExpiry) {
      return { success: false, error: messages.expired };
    }

    if (record.accessCode.toLowerCase() !== accessCode.toLowerCase()) {
      return { success: false, error: "Invalid access code" };
    }

    if (pastExpiry && !(await allowPastExpiry!())) {
      return { success: false, error: messages.expired };
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

// --- Admin editing of Proposals rows ----------------------------------------
// Writes are guarded by a hash of the row's raw cells as last read: if the row
// changed since (e.g. edited directly on the sheet while the editor was open),
// the save is refused instead of silently overwriting it.

export interface ProposalRowInput {
  accessCode: string;
  expiryDate: string;
  isActive: boolean;
  /** Serialised `data` JSON, written verbatim to column E. */
  dataJson: string;
}

export interface ProposalRowForEdit {
  record: ProposalRecord;
  /** SHA-256 of the raw A–E cells — pass back as `expectedRowHash` when saving. */
  rowHash: string;
}

function hashRawRow(cells: unknown[]): string {
  const normalised = [0, 1, 2, 3, 4].map((i) => String(cells[i] ?? ""));
  return createHash("sha256").update(JSON.stringify(normalised)).digest("hex");
}

async function readRawProposalRows(): Promise<string[][]> {
  const sheets = getGoogleSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A2:E`,
  });
  return (response.data.values || []) as string[][];
}

function rawRowToRecord(row: string[]): ProposalRecord | null {
  try {
    return {
      id: row[COLUMNS.ID]?.trim(),
      accessCode: row[COLUMNS.ACCESS_CODE]?.trim() ?? "",
      expiryDate: row[COLUMNS.EXPIRY_DATE]?.trim() ?? "",
      isActive: row[COLUMNS.IS_ACTIVE]?.trim().toLowerCase() === "true",
      data: JSON.parse(row[COLUMNS.DATA]) as ProposalData,
    };
  } catch {
    return null;
  }
}

/** The row plus its hash, or null if the id doesn't exist (or its JSON is unreadable). */
export async function getProposalRowForEdit(proposalId: string): Promise<ProposalRowForEdit | null> {
  const row = (await readRawProposalRows()).find((r) => r[COLUMNS.ID]?.trim() === proposalId);
  if (!row) return null;
  const record = rawRowToRecord(row);
  return record ? { record, rowHash: hashRawRow(row) } : null;
}

export type ProposalRowUpdate<R = never> =
  | { status: "saved"; rowHash: string }
  | { status: "conflict"; current: ProposalRowForEdit | null }
  | { status: "rejected"; reason: R }
  | { status: "not_found" }
  | { status: "busy" };

/**
 * The lock every check-and-write on a proposal's terms or its client response
 * takes (admin saves, duplication into the id, client acceptance), so those
 * can't interleave: whichever runs second sees what the first wrote.
 */
export function withProposalLock<T>(proposalId: string, fn: (lock: SheetLock) => Promise<T>, options?: { attempts?: number }) {
  return withSheetLock(`proposal:${proposalId}`, fn, options);
}

/**
 * Overwrites A–E for `proposalId` only if the row still hashes to
 * `expectedRowHash` and `guard` (given the current row) returns null. Runs
 * under the proposal lock, so the checks and the write are atomic with respect
 * to every other app save and to client responses: two saves from the same
 * starting version can't both win, and an acceptance can't slip in between
 * the guard's checks and the write. (Hand edits on the sheet can't take the
 * lock; they're caught by the hash check.)
 */
const proposalsSheetIdCache = { value: null as number | null };

export async function updateProposalRow<R = never>(
  proposalId: string,
  expectedRowHash: string,
  input: ProposalRowInput,
  guard?: (current: ProposalRowForEdit) => Promise<R | null>
): Promise<ProposalRowUpdate<R>> {
  const locked = await withProposalLock(proposalId, (lock) =>
    writeProposalRowIfUnchanged(lock, proposalId, expectedRowHash, input, guard)
  );
  return locked.status === "busy" ? { status: "busy" } : locked.value;
}

/**
 * The check-and-write of `updateProposalRow` for a caller that already holds
 * the proposal lock (e.g. publishing a revision, which also records an event
 * under the same lock). Taking the lock again would report `busy`.
 */
export function updateProposalRowLocked<R = never>(
  lock: SheetLock,
  proposalId: string,
  expectedRowHash: string,
  input: ProposalRowInput,
  guard?: (current: ProposalRowForEdit) => Promise<R | null>
): Promise<Exclude<ProposalRowUpdate<R>, { status: "busy" }>> {
  return writeProposalRowIfUnchanged(lock, proposalId, expectedRowHash, input, guard);
}

async function writeProposalRowIfUnchanged<R>(
  lock: SheetLock,
  proposalId: string,
  expectedRowHash: string,
  input: ProposalRowInput,
  guard?: (current: ProposalRowForEdit) => Promise<R | null>
): Promise<Exclude<ProposalRowUpdate<R>, { status: "busy" }>> {
  // Read and written through the row's anchor, not its row number, so rows
  // inserted, deleted or sorted on the sheet meanwhile can't redirect the
  // write onto another proposal. (A hand edit to this same row between the
  // check and the write is still possible — Sheets has no compare-and-swap.)
  const sheets = getGoogleSheetsClient();
  const sheetId = await getSheetId(sheets, SHEET_NAME, proposalsSheetIdCache);
  if (sheetId === null) return { status: "not_found" };
  const row = await readRowByAnchor(sheets, SHEET_NAME, sheetId, proposalId, lock);
  if (!row) return { status: "not_found" };
  const record = rawRowToRecord(row);
  const rowHash = hashRawRow(row);
  // Stale editor first: no point running checks for a save that would be refused.
  if (rowHash !== expectedRowHash) return { status: "conflict", current: record ? { record, rowHash } : null };
  if (!record) return { status: "not_found" };
  if (guard) {
    const reason = await guard({ record, rowHash });
    if (reason !== null) return { status: "rejected", reason };
  }

  const cells = [proposalId, input.accessCode, input.expiryDate, input.isActive ? "TRUE" : "FALSE", input.dataJson];
  // Nothing updated: the row was deleted since the check.
  if (!(await writeRowByAnchor(sheets, sheetId, proposalId, cells, lock))) return { status: "not_found" };
  return { status: "saved", rowHash: hashRawRow(cells) };
}

/** Adds a new proposal row. Refuses ids that already exist (atomically, under the id's lock). */
export async function appendProposalRow(
  proposalId: string,
  input: ProposalRowInput
): Promise<{ status: "created" } | { status: "exists" } | { status: "busy" }> {
  const locked = await withProposalLock(proposalId, (lock) => appendProposalRowIfAbsent(lock, proposalId, input));
  return locked.status === "busy" ? { status: "busy" } : locked.value;
}

async function appendProposalRowIfAbsent(
  lock: SheetLock,
  proposalId: string,
  input: ProposalRowInput
): Promise<{ status: "created" } | { status: "exists" }> {
  const rows = await readRawProposalRows();
  if (rows.some((r) => r[COLUMNS.ID]?.trim() === proposalId)) return { status: "exists" };
  const sheets = getGoogleSheetsClient();
  const sheetId = await getSheetId(sheets, SHEET_NAME, proposalsSheetIdCache);
  await appendAnchoredRow(
    sheets,
    SHEET_NAME,
    sheetId,
    [proposalId, input.accessCode, input.expiryDate, input.isActive ? "TRUE" : "FALSE", input.dataJson],
    lock
  );
  return { status: "created" };
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
 * Verify access for an ongoing engagement (proposal page, assets, tracker).
 *
 * `expiryDate` closes the proposal *offer*, not the engagement: once the
 * client has accepted, access continues past expiry. `isActive = false` still
 * revokes everything. Use `verifyProposalAccess` for actions that belong to
 * the offer itself (submitting an acceptance or counter).
 */
export async function verifyEngagementAccess(
  proposalId: string,
  accessCode: string
): Promise<{ success: boolean; proposal?: ProposalData; expiryDate?: string; error?: string }> {
  const result = await verifyAccessGated<ProposalData>(
    SHEET_NAME,
    proposalId,
    accessCode,
    {
      notFound: "Proposal not found",
      inactive: "This proposal is no longer available",
      expired: "This proposal has expired",
    },
    async () => (await getProposalAcceptance(proposalId))?.status === "accepted"
  );
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

// Acceptance — stored in "ProposalAcceptance" tab (columns documented at getProposalAcceptance)
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

/**
 * Checked asset item ids per proposal in one read (admin dashboard). Throws on
 * failure: an empty result would misreport progress as zero.
 */
export async function getAllCheckedAssetsByProposal(): Promise<Map<string, Set<string>>> {
  const out = new Map<string, Set<string>>();
  const sheets = getGoogleSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${ASSETS_SHEET_NAME}!A2:D`,
  });
  for (const row of response.data.values || []) {
    const proposalId = row[0]?.trim();
    const itemId = row[1]?.trim();
    if (!proposalId || !itemId || row[2]?.trim().toLowerCase() !== "true") continue;
    const set = out.get(proposalId) ?? new Set<string>();
    set.add(itemId);
    out.set(proposalId, set);
  }
  return out;
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

// ProposalAcceptance sheet columns: A:proposalId | B:status | C:counterNote | D:acceptedAt | E:packageId | F:paymentPlanId | G:proposalVersion

/** The proposal's response, or null if it has none. Throws if the tab can't be read. */
export async function readProposalAcceptance(proposalId: string): Promise<ProposalAcceptance | null> {
  const sheets = getGoogleSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${ACCEPTANCE_SHEET_NAME}!A2:G`,
  });
  const row = (response.data.values || []).find((r) => r[0]?.trim() === proposalId);
  return row ? rowToAcceptance(row) : null;
}

/**
 * Lenient variant for client-facing pages: a failed read is treated as "no
 * response yet". Don't use it where the answer gates a decision (e.g. the admin
 * save's accepted-terms check) — use `readProposalAcceptance`.
 */
export async function getProposalAcceptance(proposalId: string): Promise<ProposalAcceptance | null> {
  try {
    return await readProposalAcceptance(proposalId);
  } catch (error) {
    console.error("Failed to fetch proposal acceptance:", error);
    return null;
  }
}

function rowToAcceptance(row: string[]): ProposalAcceptance {
  return {
    status: (row[1]?.trim() || "pending") as AcceptanceStatus,
    counterNote: row[2]?.trim() || undefined,
    acceptedAt: row[3]?.trim() || "",
    packageId: row[4]?.trim() || undefined,
    paymentPlanId: row[5]?.trim() || undefined,
    proposalVersion: row[6]?.trim() || undefined,
  };
}

/**
 * Every proposal's response in one read (admin dashboard). Throws on failure:
 * an empty result would misreport accepted proposals as unanswered.
 */
export async function getAllAcceptances(): Promise<Map<string, ProposalAcceptance>> {
  const out = new Map<string, ProposalAcceptance>();
  const sheets = getGoogleSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${ACCEPTANCE_SHEET_NAME}!A2:G`,
  });
  for (const row of response.data.values || []) {
    const proposalId = row[0]?.trim();
    if (proposalId) out.set(proposalId, rowToAcceptance(row));
  }
  return out;
}

const acceptanceSheetIdCache = { value: null as number | null };

/** Under `withProposalLock`, pass the lock so the write is deadline-checked. */
export async function setProposalAcceptance(
  proposalId: string,
  acceptance: Omit<ProposalAcceptance, "acceptedAt">,
  lock?: SheetLock
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
    acceptance.proposalVersion ?? "",
  ];

  // Through the row's anchor (see "Row anchors"), so a row inserted or
  // deleted by hand meanwhile can't redirect the write onto another proposal.
  const sheetId = await getSheetId(sheets, ACCEPTANCE_SHEET_NAME, acceptanceSheetIdCache);
  if (sheetId !== null && (await readRowByAnchor(sheets, ACCEPTANCE_SHEET_NAME, sheetId, proposalId, lock))) {
    if (await writeRowByAnchor(sheets, sheetId, proposalId, row, lock)) return;
    // The row was deleted since the read: fall through and add it again.
  }
  await appendAnchoredRow(sheets, ACCEPTANCE_SHEET_NAME, sheetId, row, lock);
}

export async function getAcceptanceSheetId(
  sheets: ReturnType<typeof getGoogleSheetsClient>
): Promise<number | null> {
  return getSheetId(sheets, ACCEPTANCE_SHEET_NAME, acceptanceSheetIdCache);
}

// Tabs the app writes to but that older spreadsheets won't have yet are created
// on first use (with their header row) instead of failing with an invalid-range
// error. Cached per instance once confirmed. Creation races between instances
// are tolerated: "already exists" means another instance won.
const ensuredTabs = new Set<string>();

async function ensureTab(
  sheets: ReturnType<typeof getGoogleSheetsClient>,
  title: string,
  headers: string[]
): Promise<void> {
  if (ensuredTabs.has(title)) return;
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID, fields: "sheets.properties.title" });
  if (!meta.data.sheets?.some((s) => s.properties?.title === title)) {
    try {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: { requests: [{ addSheet: { properties: { title } } }] },
      });
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${title}!A1`,
        valueInputOption: "RAW",
        requestBody: { values: [headers] },
      });
    } catch (error) {
      if (!String((error as Error)?.message ?? error).includes("already exists")) throw error;
    }
  }
  ensuredTabs.add(title);
}

// Sheet locks — "SheetLocks" tab, append-only event log.
// Columns: A:key | B:token | C:at | D:event (acquire | release)
//
// A mutex for read-check-write sequences across server instances, built the
// same way as the sign-in ledger: Sheets serialises appends, so the order of
// `acquire` rows is a total order. The holder is the earliest acquire for the
// key that hasn't been released and is within its lease. Each caller appends
// its acquire, reads the log, and proceeds only if it is the holder;
// otherwise it releases its own row and reports `busy`. The lease bounds how
// long a crashed instance can block others.
//
// Sheets has no conditional write, so the sheet can't refuse a write from a
// holder whose lease has run out. Instead the holder never *starts* a write it
// can't finish in time: `lock.assertHeld()` before each write refuses once the
// safe window has passed (measured from before the acquire was appended, so it
// errs early), and writes under the lock carry `lock.requestOptions`, a client
// timeout that abandons a slow call instead of letting it land late. The
// margins cover that timeout plus clock skew between instances (the lease is
// judged against each reader's clock). Residual risk: a write that reaches
// Google just before its timeout and is applied more than ~20 s late — ruling
// that out needs a store with compare-and-swap. Normal holds take seconds.
const LOCK_SHEET_NAME = "SheetLocks";
const LOCK_HEADERS = ["key", "token", "at", "event"];
const LOCK_LEASE_MS = 60_000;
const LOCK_WRITE_TIMEOUT_MS = 10_000;
const LOCK_CLOCK_SKEW_MS = 10_000;
const LOCK_SAFE_MS = LOCK_LEASE_MS - LOCK_WRITE_TIMEOUT_MS - LOCK_CLOCK_SKEW_MS;

/** Thrown by `assertHeld()` once the holder can no longer safely write. */
export class SheetLockExpiredError extends Error {
  constructor(key: string) {
    super(`Sheet lock ${key} is past its safe window; refusing to write`);
    this.name = "SheetLockExpiredError";
  }
}

/** Handed to the critical section of `withSheetLock`. */
export interface SheetLock {
  /** Call immediately before each write; throws `SheetLockExpiredError` when out of time. */
  assertHeld(): void;
  /** googleapis per-request options for writes made under the lock. */
  readonly requestOptions: { timeout: number };
}

async function appendLockEvent(key: string, token: string, event: "acquire" | "release"): Promise<void> {
  const sheets = getGoogleSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${LOCK_SHEET_NAME}!A:D`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [[key, token, new Date().toISOString(), event]] },
  });
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Runs `fn` while holding `key`. `busy` means another holder had it (after
 * `attempts` tries, spaced 0.5–1.5 s apart) or `fn` ran out of time before a
 * write — either way nothing was written past that point.
 */
export async function withSheetLock<T>(
  key: string,
  fn: (lock: SheetLock) => Promise<T>,
  { attempts = 1 }: { attempts?: number } = {}
): Promise<{ status: "ok"; value: T } | { status: "busy" }> {
  for (let attempt = 1; ; attempt++) {
    const result = await tryWithSheetLock(key, fn);
    if (result !== "contended") return result;
    if (attempt >= attempts) return { status: "busy" };
    await sleep(500 + Math.random() * 1000);
  }
}

async function tryWithSheetLock<T>(
  key: string,
  fn: (lock: SheetLock) => Promise<T>
): Promise<{ status: "ok"; value: T } | { status: "busy" } | "contended"> {
  const sheets = getGoogleSheetsClient();
  await ensureTab(sheets, LOCK_SHEET_NAME, LOCK_HEADERS);
  const token = randomBytes(12).toString("base64url");
  const deadline = Date.now() + LOCK_SAFE_MS;
  await appendLockEvent(key, token, "acquire");

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${LOCK_SHEET_NAME}!A2:D`,
    });
    const events = (response.data.values || []).filter((r) => r[0]?.trim() === key);
    const released = new Set(events.filter((r) => r[3]?.trim() === "release").map((r) => r[1]?.trim()));
    const now = Date.now();
    const holder = events.find(
      (r) =>
        r[3]?.trim() === "acquire" &&
        !released.has(r[1]?.trim()) &&
        now - new Date(r[2]).getTime() < LOCK_LEASE_MS
    );
    if (holder?.[1]?.trim() !== token) return "contended";
    const lock: SheetLock = {
      assertHeld() {
        if (Date.now() >= deadline) throw new SheetLockExpiredError(key);
      },
      requestOptions: { timeout: LOCK_WRITE_TIMEOUT_MS },
    };
    const heldFrom = Date.now();
    try {
      return { status: "ok", value: await fn(lock) };
    } catch (error) {
      if (!(error instanceof SheetLockExpiredError)) throw error;
      console.warn(error.message);
      return { status: "busy" };
    } finally {
      noteLockHeld(Date.now() - heldFrom);
    }
  } finally {
    // Release whether we held it or not — a losing acquire must not block others.
    await appendLockEvent(key, token, "release").catch((error) =>
      console.error(`Failed to release sheet lock ${key} (expires with its lease):`, error)
    );
  }
}

// Row anchors — stable row identity for rows the app rewrites in place.
//
// A row number read from the sheet is only a guess at write time: a row
// inserted, deleted or sorted by hand in between shifts it, and a write by
// number then lands on a different record. Instead each such row carries
// developer metadata (key `andromeda:rowKey`, value = the row's id in column A,
// invisible in the UI) attached to the row itself, which Sheets moves with the
// row through inserts, deletes and sorts, and removes when the row is deleted.
// Reads and writes go through that anchor (`…ByDataFilter`), so they reach the
// record wherever it is now; a write to a deleted row updates nothing. Anchors
// are created lazily (first write of an existing row) and on append, always
// under the record's lock. Every anchored read re-checks column A, and a stale
// anchor (e.g. a cut-and-paste across rows) is rebuilt.
const ROW_ANCHOR_KEY = "andromeda:rowKey";
type SheetsClient = ReturnType<typeof getGoogleSheetsClient>;

function rowAnchorFilter(sheetId: number, rowKey: string) {
  return {
    developerMetadataLookup: {
      metadataKey: ROW_ANCHOR_KEY,
      metadataValue: rowKey,
      locationType: "ROW",
      metadataLocation: { sheetId },
    },
  };
}

type AnchoredRead = { status: "ok"; cells: string[] } | { status: "missing" } | { status: "stale" };

async function readAnchoredRow(sheets: SheetsClient, sheetId: number, rowKey: string): Promise<AnchoredRead> {
  const response = await sheets.spreadsheets.values.batchGetByDataFilter({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: { dataFilters: [rowAnchorFilter(sheetId, rowKey)] },
  });
  const ranges = response.data.valueRanges || [];
  if (ranges.length === 0) return { status: "missing" };
  // More than one anchor, or one that no longer sits on its id: rebuild.
  const cells = (ranges[0].valueRange?.values?.[0] || []) as string[];
  if (ranges.length > 1 || cells[0]?.trim() !== rowKey) return { status: "stale" };
  return { status: "ok", cells };
}

async function anchorRow(
  sheets: SheetsClient,
  sheetId: number,
  rowKey: string,
  rowIndex: number,
  options?: { timeout: number }
): Promise<void> {
  await sheets.spreadsheets.batchUpdate(
    {
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            createDeveloperMetadata: {
              developerMetadata: {
                metadataKey: ROW_ANCHOR_KEY,
                metadataValue: rowKey,
                visibility: "DOCUMENT",
                location: { dimensionRange: { sheetId, dimension: "ROWS", startIndex: rowIndex, endIndex: rowIndex + 1 } },
              },
            },
          },
        ],
      },
    },
    options
  );
}

async function dropRowAnchors(sheets: SheetsClient, sheetId: number, rowKey: string): Promise<void> {
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: { requests: [{ deleteDeveloperMetadata: { dataFilter: rowAnchorFilter(sheetId, rowKey) } }] },
  });
}

/**
 * The current cells of the row whose column A is `rowKey`, read through its
 * anchor (created if missing, rebuilt if stale), or null if no row has that
 * id. Call under the record's lock: anchors are created here.
 */
async function readRowByAnchor(
  sheets: SheetsClient,
  tabName: string,
  sheetId: number,
  rowKey: string,
  lock?: SheetLock
): Promise<string[] | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const read = await readAnchoredRow(sheets, sheetId, rowKey);
    if (read.status === "ok") return read.cells;
    if (read.status === "stale") await dropRowAnchors(sheets, sheetId, rowKey);
    const ids = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${tabName}!A:A` });
    const rowIndex = (ids.data.values || []).findIndex((r, i) => i > 0 && r[0]?.trim() === rowKey);
    if (rowIndex === -1) return null;
    lock?.assertHeld();
    await anchorRow(sheets, sheetId, rowKey, rowIndex, lock?.requestOptions);
    // Loop: read back through the new anchor, which also confirms it.
  }
  throw new Error(`Couldn't anchor ${tabName} row ${rowKey}`);
}

/** Writes `cells` from column A of the anchored row. False if the row no longer exists. */
async function writeRowByAnchor(
  sheets: SheetsClient,
  sheetId: number,
  rowKey: string,
  cells: string[],
  lock?: SheetLock
): Promise<boolean> {
  lock?.assertHeld();
  const response = await sheets.spreadsheets.values.batchUpdateByDataFilter(
    {
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        valueInputOption: "RAW",
        data: [{ dataFilter: rowAnchorFilter(sheetId, rowKey), majorDimension: "ROWS", values: [cells] }],
      },
    },
    lock?.requestOptions
  );
  return (response.data.totalUpdatedCells ?? 0) > 0;
}

/** Appends a row and anchors it. The anchor is best-effort: it's created lazily on the next write otherwise. */
async function appendAnchoredRow(
  sheets: SheetsClient,
  tabName: string,
  sheetId: number | null,
  cells: string[],
  lock?: SheetLock
): Promise<void> {
  lock?.assertHeld();
  const response = await sheets.spreadsheets.values.append(
    {
      spreadsheetId: SPREADSHEET_ID,
      range: `${tabName}!A:${String.fromCharCode(64 + cells.length)}`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [cells] },
    },
    lock?.requestOptions
  );
  const row = Number(response.data.updates?.updatedRange?.match(/![A-Z]+(\d+)/)?.[1]);
  if (sheetId === null || !row) return;
  try {
    await anchorRow(sheets, sheetId, cells[0], row - 1, lock?.requestOptions);
  } catch (error) {
    console.error(`Couldn't anchor new ${tabName} row ${cells[0]} (will retry on next write):`, error);
  }
}

// Engagement events — "EngagementEvents" tab, append-only.
// Columns: A:proposalId | B:at | C:event | D:proposalVersion | E:detail (JSON) | F:ip | G:userAgent
//
// The engagement's audit trail, one row per thing that happened. Phase C
// records revisions; the agreement flow (signing, execution) adds its own
// event types to the same log. Nothing is ever updated in place: a later
// event (e.g. the email outcome) is a new row, and readers fold rows together.
const EVENTS_SHEET_NAME = "EngagementEvents";
const EVENTS_HEADERS = ["proposalId", "at", "event", "proposalVersion", "detail", "ip", "userAgent"];

export type EngagementEventType =
  | "revision_published"
  | "revision_email"
  | "agreement_prepared"
  | "agreement_updated"
  | "agreement_provider_signed"
  | "agreement_signature_voided";

export interface EngagementEventInput {
  proposalId: string;
  event: EngagementEventType;
  proposalVersion: string;
  detail: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

/** Appends one event; under a lock, pass it so the write is deadline-checked. */
export async function appendEngagementEvent(input: EngagementEventInput, lock?: SheetLock): Promise<string> {
  const sheets = getGoogleSheetsClient();
  await ensureTab(sheets, EVENTS_SHEET_NAME, EVENTS_HEADERS);
  const at = new Date().toISOString();
  lock?.assertHeld();
  await sheets.spreadsheets.values.append(
    {
      spreadsheetId: SPREADSHEET_ID,
      range: `${EVENTS_SHEET_NAME}!A:G`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: {
        values: [[input.proposalId, at, input.event, input.proposalVersion, JSON.stringify(input.detail), input.ip ?? "", input.userAgent ?? ""]],
      },
    },
    lock?.requestOptions
  );
  return at;
}

interface EventRow {
  proposalId: string;
  at: string;
  event: string;
  proposalVersion: string;
  detail: Record<string, unknown>;
}

async function readEngagementEvents(): Promise<EventRow[]> {
  const sheets = getGoogleSheetsClient();
  await ensureTab(sheets, EVENTS_SHEET_NAME, EVENTS_HEADERS);
  const response = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${EVENTS_SHEET_NAME}!A2:E` });
  return (response.data.values || []).map((r) => {
    let detail: Record<string, unknown> = {};
    try {
      detail = r[4] ? (JSON.parse(r[4]) as Record<string, unknown>) : {};
    } catch {
      // A hand-edited, unreadable detail cell: keep the row, drop the detail.
    }
    return { proposalId: r[0]?.trim() ?? "", at: r[1]?.trim() ?? "", event: r[2]?.trim() ?? "", proposalVersion: r[3]?.trim() ?? "", detail };
  });
}

const text = (value: unknown) => (typeof value === "string" ? value : undefined);

/**
 * Folds a proposal's events (in sheet order) into its published revisions,
 * keyed by version. Email rows: `sending` reserves an attempt (see the publish
 * route), `sent` is final, `failed` counts a recorded failure.
 */
function foldRevisions(rows: EventRow[]): Map<string, PublishedRevision> {
  const byVersion = new Map<string, PublishedRevision>();
  for (const row of rows) {
    if (row.event === "revision_published") {
      // The first publish of a version is the revision; later ones are no-ops (the API refuses them).
      if (byVersion.has(row.proposalVersion)) continue;
      const notify = row.detail.notify === true;
      byVersion.set(row.proposalVersion, {
        proposalVersion: row.proposalVersion,
        publishedAt: row.at,
        note: text(row.detail.note) ?? "",
        expiryDate: text(row.detail.expiryDate),
        extendedFrom: text(row.detail.extendedFrom),
        // A publish with notify on is itself the first attempt's reservation.
        email: notify
          ? { status: "pending", to: text(row.detail.emailTo), reservedAt: row.at, failures: 0 }
          : { status: "skipped", failures: 0 },
      });
    } else if (row.event === "revision_email") {
      const revision = byVersion.get(row.proposalVersion);
      // A success is final: a later failure or reservation doesn't undo it.
      if (!revision || revision.email.status === "sent") continue;
      const to = text(row.detail.to) ?? revision.email.to;
      const failures = revision.email.failures ?? 0;
      if (row.detail.status === "sending") {
        revision.email = { status: "pending", to, reservedAt: row.at, failures };
      } else if (row.detail.status === "sent") {
        revision.email = { status: "sent", to, at: row.at, failures };
      } else {
        revision.email = { status: "failed", to, at: row.at, error: text(row.detail.error), failures: failures + 1 };
      }
    }
  }
  return byVersion;
}

/** The revision published for exactly this version, or null. Throws if the log can't be read. */
export async function readPublishedRevision(proposalId: string, version: string): Promise<PublishedRevision | null> {
  const rows = (await readEngagementEvents()).filter((r) => r.proposalId === proposalId);
  return foldRevisions(rows).get(version) ?? null;
}

/** Lenient variant for the client page: no notice beats a failed page. */
export async function getPublishedRevision(proposalId: string, version: string): Promise<PublishedRevision | null> {
  try {
    return await readPublishedRevision(proposalId, version);
  } catch (error) {
    console.error(`Revision lookup failed for ${proposalId}@${version}:`, error);
    return null;
  }
}

/** Every proposal's published revisions (all versions), for the dashboard. Throws on failure. */
export async function getAllRevisionsByProposal(): Promise<Map<string, Map<string, PublishedRevision>>> {
  const grouped = new Map<string, EventRow[]>();
  for (const row of await readEngagementEvents()) {
    if (!row.proposalId) continue;
    grouped.set(row.proposalId, [...(grouped.get(row.proposalId) ?? []), row]);
  }
  return new Map([...grouped].map(([id, rows]) => [id, foldRevisions(rows)]));
}

// Agreements — "Agreements" tab, one row per proposal (anchored).
// Columns: A:proposalId | B:status | C:templateId | D:templateVersion | E:templateHash | F:proposalVersion |
//          G:provider (JSON) | H:specialTerms (JSON) | I:offerValidUntil | J:agreementHash | K:providerSignature (JSON) | L:updatedAt
//          M:selection (JSON — the client's chosen package / payment plan, pinned from the acceptance)
//          N:clientName (pinned from the accepted snapshot; empty on records prepared before it was stored)
//          O:acceptedAt (when the client accepted, pinned from the acceptance; empty on older records)
// Current state only; every change is also an EngagementEvents row (the evidence trail).
const AGREEMENTS_SHEET_NAME = "Agreements";
const AGREEMENTS_HEADERS = [
  "proposalId", "status", "templateId", "templateVersion", "templateHash", "proposalVersion",
  "provider", "specialTerms", "offerValidUntil", "agreementHash", "providerSignature", "updatedAt", "selection",
  "clientName", "acceptedAt",
];
const agreementsSheetIdCache = { value: null as number | null };

function rowToAgreement(r: string[]): AgreementRecord | null {
  // Ids, hashes and dates below are app-generated (never whitespace), so trimming
  // them only guards against hand edits; free text that feeds the agreement
  // hash (client name; JSON columns) is read exactly as stored.
  try {
    return {
      proposalId: r[0].trim(),
      status: r[1]?.trim() === "provider_signed" ? "provider_signed" : "draft",
      templateId: r[2]?.trim() ?? "",
      templateVersion: Number(r[3]),
      templateHash: r[4]?.trim() ?? "",
      proposalVersion: r[5]?.trim() ?? "",
      provider: JSON.parse(r[6]),
      specialTerms: r[7] ? JSON.parse(r[7]) : [],
      offerValidUntil: r[8]?.trim() ?? "",
      agreementHash: r[9]?.trim() ?? "",
      providerSignature: r[10] ? JSON.parse(r[10]) : null,
      updatedAt: r[11]?.trim() ?? "",
      selection: r[12] ? JSON.parse(r[12]) : {},
      acceptedAt: r[14]?.trim() || undefined,
      // Verbatim, not trimmed: the name is part of the agreement hash, and
      // Sheets stores RAW strings exactly (incl. surrounding whitespace).
      clientName: r[13] ?? "",
    };
  } catch {
    return null; // a hand-edited, unreadable row
  }
}

function agreementToRow(a: AgreementRecord): string[] {
  return [
    a.proposalId, a.status, a.templateId, String(a.templateVersion), a.templateHash, a.proposalVersion,
    JSON.stringify(a.provider), JSON.stringify(a.specialTerms), a.offerValidUntil, a.agreementHash,
    a.providerSignature ? JSON.stringify(a.providerSignature) : "", a.updatedAt, JSON.stringify(a.selection ?? {}),
    a.clientName ?? "", a.acceptedAt ?? "",
  ];
}

async function readAgreementRows(): Promise<string[][]> {
  const sheets = getGoogleSheetsClient();
  await ensureTab(sheets, AGREEMENTS_SHEET_NAME, AGREEMENTS_HEADERS);
  const response = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${AGREEMENTS_SHEET_NAME}!A2:O` });
  return (response.data.values || []) as string[][];
}

/** The agreement for a proposal, or null. Throws if the tab can't be read (or the row is unreadable). */
export async function readAgreement(proposalId: string): Promise<AgreementRecord | null> {
  const row = (await readAgreementRows()).find((r) => r[0]?.trim() === proposalId);
  if (!row) return null;
  const record = rowToAgreement(row);
  if (!record) throw new Error(`Agreements row for ${proposalId} is unreadable`);
  return record;
}

/** Every proposal's agreement, for the dashboard. Throws on read failure. */
export async function getAllAgreements(): Promise<Map<string, AgreementRecord>> {
  const map = new Map<string, AgreementRecord>();
  for (const row of await readAgreementRows()) {
    const record = row[0] ? rowToAgreement(row) : null;
    if (record) map.set(record.proposalId, record);
  }
  return map;
}

/** Creates or replaces a proposal's agreement row, through its anchor. Call under the proposal lock. */
export async function writeAgreement(record: AgreementRecord, lock: SheetLock): Promise<void> {
  const sheets = getGoogleSheetsClient();
  await ensureTab(sheets, AGREEMENTS_SHEET_NAME, AGREEMENTS_HEADERS);
  const sheetId = await getSheetId(sheets, AGREEMENTS_SHEET_NAME, agreementsSheetIdCache);
  const cells = agreementToRow(record);
  if (sheetId !== null && (await readRowByAnchor(sheets, AGREEMENTS_SHEET_NAME, sheetId, record.proposalId, lock))) {
    if (await writeRowByAnchor(sheets, sheetId, record.proposalId, cells, lock)) return;
  }
  await appendAnchoredRow(sheets, AGREEMENTS_SHEET_NAME, sheetId, cells, lock);
}

// Proposal snapshots — "ProposalSnapshots" tab, append-only.
// Columns: A:proposalId | B:proposalVersion | C:capturedAt | D:reason | E…Z:data
// One row per (proposalId, proposalVersion): the exact terms a response was made against.
// `data` is the canonical JSON split into consecutive cells (E, F, G, …) because
// Sheets rejects any single cell over 50,000 characters; concatenate E onward to
// read it back (`getProposalSnapshot`).
const SNAPSHOT_SHEET_NAME = "ProposalSnapshots";
const SNAPSHOT_HEADERS = ["proposalId", "proposalVersion", "capturedAt", "reason", "data"];
const SNAPSHOT_CHUNK_CHARS = 49_000; // headroom under the 50k cell limit
const SNAPSHOT_MAX_CHUNKS = 22; // columns E–Z ≈ 1.07M characters

export type SnapshotReason = "accepted" | "changes_requested" | "revision_published";
/** `too_large`: terms exceed E–Z even when split; only the row (with hash) was written. */
export type SnapshotResult = "stored" | "duplicate" | "too_large";

function chunk(text: string, size: number): string[] {
  const parts: string[] = [];
  for (let i = 0; i < text.length; i += size) parts.push(text.slice(i, i + size));
  return parts.length ? parts : [""];
}

/** Records the terms for a version once; repeat calls for the same version are no-ops. */
export async function saveProposalSnapshot(
  proposalId: string,
  proposalVersion: string,
  reason: SnapshotReason,
  canonicalJson: string,
  lock?: SheetLock
): Promise<SnapshotResult> {
  const sheets = getGoogleSheetsClient();
  await ensureTab(sheets, SNAPSHOT_SHEET_NAME, SNAPSHOT_HEADERS);
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SNAPSHOT_SHEET_NAME}!A2:B`,
  });
  const rows = existing.data.values || [];
  if (rows.some((r) => r[0]?.trim() === proposalId && r[1]?.trim() === proposalVersion)) return "duplicate";

  let parts = chunk(canonicalJson, SNAPSHOT_CHUNK_CHARS);
  let result: SnapshotResult = "stored";
  if (parts.length > SNAPSHOT_MAX_CHUNKS) {
    console.error(
      `Proposal snapshot for ${proposalId}@${proposalVersion} is ${canonicalJson.length} chars — beyond ${SNAPSHOT_MAX_CHUNKS} cells; storing hash only`
    );
    parts = ["[too large]"];
    result = "too_large";
  }

  lock?.assertHeld();
  await sheets.spreadsheets.values.append(
    {
      spreadsheetId: SPREADSHEET_ID,
      range: `${SNAPSHOT_SHEET_NAME}!A:Z`,
      valueInputOption: "RAW",
      requestBody: { values: [[proposalId, proposalVersion, new Date().toISOString(), reason, ...parts]] },
    },
    lock?.requestOptions
  );
  return result;
}

const isSnapshotRow = (r: string[] | undefined, proposalId: string, proposalVersion: string) =>
  !!r && r[0]?.trim() === proposalId && r[1]?.trim() === proposalVersion;

/**
 * The exact canonical JSON stored for a version, or null if absent (or stored
 * as too large). Reads the small id/version columns to find the row, then only
 * that row — not every snapshot of every proposal. The fetched row's identity
 * is re-checked: if a hand sort or insert moved rows between the two reads, it
 * looks again once, then falls back to the full read rather than ever
 * returning another proposal's terms.
 */
export async function getProposalSnapshot(
  proposalId: string,
  proposalVersion: string
): Promise<string | null> {
  const sheets = getGoogleSheetsClient();
  const dataOf = (row: string[]) => {
    const data = row.slice(4).join("");
    return data === "[too large]" ? null : data;
  };
  for (let attempt = 0; attempt < 2; attempt++) {
    const index = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${SNAPSHOT_SHEET_NAME}!A2:B` });
    const i = (index.data.values || []).findIndex((r) => isSnapshotRow(r, proposalId, proposalVersion));
    if (i === -1) return null;
    const sheetRow = i + 2;
    const fetched = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${SNAPSHOT_SHEET_NAME}!A${sheetRow}:Z${sheetRow}` });
    const row = fetched.data.values?.[0] as string[] | undefined;
    if (isSnapshotRow(row, proposalId, proposalVersion)) return dataOf(row!);
  }
  const full = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${SNAPSHOT_SHEET_NAME}!A2:Z` });
  const row = (full.data.values || []).find((r) => isSnapshotRow(r, proposalId, proposalVersion));
  return row ? dataOf(row) : null;
}

// Agreement snapshots — "AgreementSnapshots" tab, append-only.
// Columns: A:proposalId | B:agreementHash | C:capturedAt | D:reason | E…Z:data (chunked like ProposalSnapshots)
// One row per signing occurrence — keyed by agreement hash *and* the signature's
// signedAt (column C), since the same content can be signed again after a void.
// The full signed record plus the terms text, written *before* the signed
// record so a signature can never outlive its evidence.
const AGREEMENT_SNAPSHOT_SHEET_NAME = "AgreementSnapshots";
const AGREEMENT_SNAPSHOT_HEADERS = ["proposalId", "agreementHash", "capturedAt", "reason", "data"];

/**
 * Whether a snapshot row (same proposal and hash) is this exact signature.
 * Rows carry the signature's signedAt in column C — except rows written before
 * snapshots were keyed per signature, where C is the capture time (a few ms
 * later). Those are matched by the signature recorded inside their JSON, so
 * legacy evidence is found rather than treated as missing and rebuilt.
 */
function snapshotRowIsSignature(row: string[], signedAt: string): boolean {
  if (row[2]?.trim() === signedAt) return true;
  try {
    const data = JSON.parse(row.slice(4).join("")) as { record?: { providerSignature?: { signedAt?: string } | null } };
    return data.record?.providerSignature?.signedAt === signedAt;
  } catch {
    return false; // unreadable data never counts as a match
  }
}

/**
 * Stores one signing occurrence ("duplicate" only if this exact signature —
 * same hash and signedAt — is already stored, e.g. a retried write).
 * Throws instead of degrading: signing must fail rather than proceed without evidence.
 */
export async function saveAgreementSnapshot(
  proposalId: string,
  agreementHash: string,
  signedAt: string,
  reason: "provider_signed",
  json: string,
  lock: SheetLock
): Promise<"stored" | "duplicate"> {
  const sheets = getGoogleSheetsClient();
  await ensureTab(sheets, AGREEMENT_SNAPSHOT_SHEET_NAME, AGREEMENT_SNAPSHOT_HEADERS);
  const existing = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${AGREEMENT_SNAPSHOT_SHEET_NAME}!A2:C` });
  const sameHash = (existing.data.values || []).filter((r) => r[0]?.trim() === proposalId && r[1]?.trim() === agreementHash);
  if (sameHash.some((r) => r[2]?.trim() === signedAt)) return "duplicate";
  // Same content stored before under a different C: only then read the data
  // cells, to recognise a legacy row for this very signature.
  if (sameHash.length) {
    const full = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${AGREEMENT_SNAPSHOT_SHEET_NAME}!A2:Z` });
    const candidates = (full.data.values || []).filter((r) => r[0]?.trim() === proposalId && r[1]?.trim() === agreementHash);
    if (candidates.some((r) => snapshotRowIsSignature(r, signedAt))) return "duplicate";
  }
  const parts = chunk(json, SNAPSHOT_CHUNK_CHARS);
  if (parts.length > SNAPSHOT_MAX_CHUNKS) throw new Error(`Agreement snapshot for ${proposalId} is ${json.length} chars — too large to store`);
  lock.assertHeld();
  await sheets.spreadsheets.values.append(
    {
      spreadsheetId: SPREADSHEET_ID,
      range: `${AGREEMENT_SNAPSHOT_SHEET_NAME}!A:Z`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [[proposalId, agreementHash, signedAt, reason, ...parts]] },
    },
    lock.requestOptions
  );
  return "stored";
}

/**
 * A stored signing occurrence's JSON, or null: the exact signature when
 * `signedAt` is given, else the latest signing of that hash. Throws if the tab
 * can't be read.
 */
export async function readAgreementSnapshot(proposalId: string, agreementHash: string, signedAt?: string): Promise<string | null> {
  const sheets = getGoogleSheetsClient();
  await ensureTab(sheets, AGREEMENT_SNAPSHOT_SHEET_NAME, AGREEMENT_SNAPSHOT_HEADERS);
  const response = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${AGREEMENT_SNAPSHOT_SHEET_NAME}!A2:Z` });
  const rows = (response.data.values || []).filter(
    (r) => r[0]?.trim() === proposalId && r[1]?.trim() === agreementHash && (!signedAt || snapshotRowIsSignature(r, signedAt))
  );
  const row = rows.at(-1);
  return row ? row.slice(4).join("") : null;
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
/** All tracker rows grouped by proposal, in one read. Throws on failure. */
export async function readAllTrackerStatesByProposal(): Promise<Map<string, TrackerMilestoneState[]>> {
  const out = new Map<string, TrackerMilestoneState[]>();
  const sheets = getGoogleSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${TRACKER_SHEET_NAME}!A2:I`,
  });
  for (const row of response.data.values || []) {
    const proposalId = row[0]?.trim();
    if (!proposalId) continue;
    const state = rowToTrackerState(row);
    if (!state.phaseId || !state.milestoneId) continue;
    const existing = out.get(proposalId);
    if (existing) existing.push(state);
    else out.set(proposalId, [state]);
  }
  return out;
}

/** Lenient variant for the weekly cron: a failed read yields no states (no emails) rather than an error. */
export async function getAllTrackerStatesByProposal(): Promise<Map<string, TrackerMilestoneState[]>> {
  try {
    return await readAllTrackerStatesByProposal();
  } catch (error) {
    console.error("Failed to fetch all tracker states:", error);
    return new Map();
  }
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


// Admin sign-in ledger — "AdminSignIns" tab, append-only event log.
// Columns: A:nonce | B:at | C:event (issued | failed | matched) | D:ip | E:userAgent
//
// Attempt limits and single use must hold across server instances, and Sheets
// has no compare-and-swap — so nothing is ever read-then-updated here. Each
// attempt appends its own row (INSERT_ROWS, so concurrent appends can't
// overwrite each other), and Sheets serialises appends, so row order is a
// total order of attempts. Each request then decides from that order alone:
// it counts only if it is among the first `maxAttempts` attempts, and a
// matching code wins only if no earlier attempt already matched. Doubles as an
// audit log of admin sign-ins.
const ADMIN_SIGNIN_SHEET_NAME = "AdminSignIns";
const ADMIN_SIGNIN_HEADERS = ["nonce", "at", "event", "ip", "userAgent"];

export async function recordAdminSignInChallenge(nonce: string, ip: string, userAgent: string): Promise<void> {
  const sheets = getGoogleSheetsClient();
  await ensureTab(sheets, ADMIN_SIGNIN_SHEET_NAME, ADMIN_SIGNIN_HEADERS);
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${ADMIN_SIGNIN_SHEET_NAME}!A:E`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [[nonce, new Date().toISOString(), "issued", ip, userAgent.slice(0, 300)]] },
  });
}

export type AdminSignInAttempt =
  /** `attemptNumber`: this attempt's 1-based position among the challenge's attempts. */
  | { status: "ok"; attemptNumber: number }
  | { status: "unknown" | "used" | "locked" };

function appendedRow(updatedRange: string | null | undefined): number | null {
  const match = updatedRange?.match(/!A(\d+)/);
  return match ? Number(match[1]) : null;
}

/**
 * Logs one verification attempt and returns its outcome, decided by the
 * attempt's position in the log (see the tab comment above): `unknown` if the
 * challenge was never issued, `used` if an earlier attempt already redeemed
 * it, `locked` if this attempt is beyond `maxAttempts`, else `ok`.
 */
export async function registerAdminSignInAttempt(
  nonce: string,
  maxAttempts: number,
  matched: boolean,
  ip: string,
  userAgent: string
): Promise<AdminSignInAttempt> {
  const sheets = getGoogleSheetsClient();
  await ensureTab(sheets, ADMIN_SIGNIN_SHEET_NAME, ADMIN_SIGNIN_HEADERS);
  const appended = await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${ADMIN_SIGNIN_SHEET_NAME}!A:E`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [[nonce, new Date().toISOString(), matched ? "matched" : "failed", ip, userAgent.slice(0, 300)]],
    },
  });
  const ownRow = appendedRow(appended.data.updates?.updatedRange);
  if (ownRow === null) throw new Error("Sign-in ledger append returned no row");

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${ADMIN_SIGNIN_SHEET_NAME}!A2:C`,
  });
  const events = (response.data.values || [])
    .map((r, i) => ({ row: i + 2, nonce: r[0]?.trim(), event: r[2]?.trim() }))
    .filter((e) => e.nonce === nonce);

  if (!events.some((e) => e.event === "issued")) return { status: "unknown" };
  const attempts = events.filter((e) => e.event === "failed" || e.event === "matched");
  const position = attempts.findIndex((e) => e.row === ownRow);
  if (position === -1) throw new Error("Sign-in ledger row not found after append");
  if (attempts.slice(0, position).some((e) => e.event === "matched")) return { status: "used" };
  if (position >= maxAttempts) return { status: "locked" };
  return { status: "ok", attemptNumber: position + 1 };
}
