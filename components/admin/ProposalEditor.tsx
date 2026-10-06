"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import CodeMirror, { EditorView, type ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { json, jsonParseLinter } from "@codemirror/lang-json";
import { linter, lintGutter, type Diagnostic } from "@codemirror/lint";
import { oneDark } from "@codemirror/theme-one-dark";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Copy,
  Loader2,
  Monitor,
  RefreshCw,
  FileSignature,
  Save,
  Send,
  Smartphone,
  Wand2,
  XCircle,
} from "lucide-react";
import type { ProposalAcceptance, ProposalDataUnion, PublishedRevision } from "@/types/proposal";
import { validateProposal, type ProposalIssue } from "@/lib/proposal-schema";
import { shortVersion } from "@/lib/proposal-version-label";
import { isoDate } from "@/lib/dates";
import { rangeForPath } from "./json-paths";
import { DiffView } from "./DiffView";
import type { PreviewMessage } from "./ProposalPreview";
import { AdminDialog, dialogButton } from "./AdminDialog";
import { Field, REVEAL_CARD_EVENT, Toggle } from "./forms/fields";
import { EngagementSwitches, type EngagementStateInitial } from "./EngagementSwitches";
import type { GateInputs } from "@/lib/engagement-gates";
import { FormErrorBoundary, SectionForms } from "./forms/SectionForms";
import { PublishRevisionDialog, type PublishOptions } from "./PublishRevisionDialog";
import { canonicalProposalJson } from "@/lib/proposal-terms";

interface EditableRow {
  accessCode: string;
  expiryDate: string;
  isActive: boolean;
  data: ProposalDataUnion;
  rowHash: string;
  proposalVersion: string;
}

interface ProposalEditorProps {
  proposalId: string;
  initial: EditableRow;
  acceptance: ProposalAcceptance | null;
  /** Canonical JSON of the version the open change request was made against, if stored. */
  changeRequestSnapshot: string | null;
  /** The revision published for the loaded version, if any. */
  publishedRevision: PublishedRevision | null;
  clientLink: string;
  /** The client hub's Assets / Progress switches; null if unreadable. */
  engagement: EngagementStateInitial | null;
}

interface Settings {
  accessCode: string;
  expiryDate: string;
  isActive: boolean;
}

type SaveState =
  | { kind: "idle" }
  | { kind: "saving" }
  | { kind: "saved"; at: Date }
  | { kind: "error"; message: string; issues?: ProposalIssue[] }
  | { kind: "confirm_accepted" }
  | { kind: "conflict"; current: EditableRow | null };

const pretty = (data: unknown) => JSON.stringify(data, null, 2);

type EditorTab = "settings" | "content" | "preview";
/** How the Content panel edits the draft: structured forms for the common sections, or the full JSON. */
type ContentView = "form" | "json";
const CONTENT_VIEW_KEY = "andromeda:admin-content-view";
const EDITOR_TABS: { id: EditorTab; label: string }[] = [
  { id: "settings", label: "Settings" },
  { id: "content", label: "Content" },
  { id: "preview", label: "Preview" },
];

/**
 * Unsaved drafts survive navigation (in-app links and the back button don't
 * fire `beforeunload`) in sessionStorage, per tab. `baseRowHash` is the row the
 * draft was started from, so a draft over an older version is offered rather
 * than silently applied — and if restored, saving hits the normal conflict check.
 */
interface StoredDraft {
  baseRowHash: string;
  text: string;
  settings: Settings;
  savedAt: string;
}
const draftKey = (proposalId: string) => `andromeda:proposal-draft:${proposalId}`;

function readDraft(proposalId: string): StoredDraft | null {
  try {
    const raw = window.sessionStorage.getItem(draftKey(proposalId));
    return raw ? (JSON.parse(raw) as StoredDraft) : null;
  } catch {
    return null;
  }
}

/** Writes the pending draft, if any, and marks it written. */
function flushDraft(proposalId: string, pending: { current: StoredDraft | null | undefined }): void {
  if (pending.current === undefined) return;
  writeDraft(proposalId, pending.current);
  pending.current = undefined;
}

function writeDraft(proposalId: string, draft: StoredDraft | null): void {
  try {
    if (draft) window.sessionStorage.setItem(draftKey(proposalId), JSON.stringify(draft));
    else window.sessionStorage.removeItem(draftKey(proposalId));
  } catch {
    // Storage unavailable (private mode, quota) — the in-page guards still apply.
  }
}
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function randomCode(length = 8): string {
  const bytes = crypto.getRandomValues(new Uint32Array(length));
  return Array.from(bytes, (n) => CODE_ALPHABET[n % CODE_ALPHABET.length]).join("");
}

function parse(text: string): { data: unknown; error: string | null } {
  try {
    return { data: JSON.parse(text), error: null };
  } catch (error) {
    return { data: null, error: (error as Error).message };
  }
}

/** Expiry pushed N days past whichever is later: today or the current expiry. */
function extendExpiry(current: string, days: number): string {
  const base = Math.max(Date.now(), new Date(current).getTime() || 0);
  return isoDate(new Date(base + days * 24 * 60 * 60 * 1000));
}

/** Terms as the publish diff shows them: canonical (key-sorted, operational keys removed), pretty-printed. */
const termsText = (data: object) => pretty(JSON.parse(canonicalProposalJson(data)));

export function ProposalEditor({ proposalId, initial, acceptance, changeRequestSnapshot, publishedRevision, clientLink, engagement }: ProposalEditorProps) {
  const router = useRouter();
  // Where a guarded link was going when the "unsaved changes" dialog opened (null = closed).
  const [leaveTo, setLeaveTo] = useState<string | null>(null);
  const leaveOpen = leaveTo !== null;
  const [text, setText] = useState(() => pretty(initial.data));
  const [settings, setSettings] = useState<Settings>({
    accessCode: initial.accessCode,
    expiryDate: initial.expiryDate,
    isActive: initial.isActive,
  });
  const [saved, setSaved] = useState({ text: pretty(initial.data), settings: { ...settingsOf(initial) } });
  const [rowHash, setRowHash] = useState(initial.rowHash);
  const [version, setVersion] = useState(initial.proposalVersion);
  const [saveState, setSaveState] = useState<SaveState>({ kind: "idle" });
  const [previewWidth, setPreviewWidth] = useState<"desktop" | "mobile">("desktop");
  // Below `lg` the editor is one panel at a time; from `lg` up all panels show side by side.
  const [tab, setTab] = useState<EditorTab>("settings");
  const [contentView, setContentView] = useState<ContentView>("form");
  const [published, setPublished] = useState<PublishedRevision | null>(publishedRevision);
  const [publishOpen, setPublishOpen] = useState(0); // >0 = open; bumped to remount the dialog fresh
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishNotice, setPublishNotice] = useState<{ revision: PublishedRevision; alreadyPublished: boolean; noteDropped: boolean } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [draftNotice, setDraftNotice] = useState<
    { kind: "restored"; savedAt: string } | { kind: "stale"; draft: StoredDraft } | null
  >(null);
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const parsed = useMemo(() => parse(text), [text]);
  const validation = useMemo(
    () => (parsed.error ? { errors: [], warnings: [] } : validateProposal(parsed.data)),
    [parsed]
  );
  const canEditData = !parsed.error && !!parsed.data && typeof parsed.data === "object" && !Array.isArray(parsed.data);
  const dirty = text !== saved.text || JSON.stringify(settings) !== JSON.stringify(saved.settings);
  const blocked = !!parsed.error || validation.errors.length > 0;

  // --- Inline diagnostics: JSON syntax (built-in) + schema errors/warnings at their paths.
  const schemaLinter = useMemo(
    () =>
      linter((view) => {
        const result = parse(view.state.doc.toString());
        if (result.error) return [];
        const { errors, warnings } = validateProposal(result.data);
        const toDiagnostic = (issue: ProposalIssue, severity: Diagnostic["severity"]): Diagnostic | null => {
          const range = rangeForPath(view.state, issue.path);
          return range
            ? { from: range.from, to: Math.max(range.to, range.from + 1), severity, message: `${issue.path || "(root)"}: ${issue.message}` }
            : null;
        };
        return [
          ...errors.map((i) => toDiagnostic(i, "error")),
          ...warnings.map((i) => toDiagnostic(i, "warning")),
        ].filter((d): d is Diagnostic => d !== null);
      }, { delay: 300 }),
    []
  );
  const extensions = useMemo(
    () => [json(), linter(jsonParseLinter()), schemaLinter, lintGutter(), EditorView.lineWrapping],
    [schemaLinter]
  );

  const jumpTo = (path: string) => {
    const view = editorRef.current?.view;
    if (!view) return;
    const range = rangeForPath(view.state, path);
    if (!range) return;
    view.dispatch({ selection: { anchor: range.from, head: range.to }, scrollIntoView: true });
    view.focus();
  };

  // Form vs JSON is a per-browser convenience; storage may be unavailable.
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        if (window.localStorage.getItem(CONTENT_VIEW_KEY) === "json") setContentView("json");
      } catch {}
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  const switchContentView = (view: ContentView) => {
    setContentView(view);
    try {
      window.localStorage.setItem(CONTENT_VIEW_KEY, view);
    } catch {}
  };

  // An issue's path points at a form field when the form shows it; otherwise
  // (or in JSON view) jump to it in the JSON.
  const jumpToIssue = (path: string) => {
    if (contentView === "form") {
      const target = path ? document.querySelector<HTMLElement>(`#editor-panel-content [data-path="${CSS.escape(path)}"]`) : null;
      if (target) {
        // Expand the card(s) holding the field, then focus it once it's rendered
        // visible (or the first input of a list).
        for (let card = target.closest("[data-card]"); card; card = card.parentElement?.closest("[data-card]") ?? null) {
          card.dispatchEvent(new Event(REVEAL_CARD_EVENT));
        }
        requestAnimationFrame(() => {
          const field = target.matches("input, textarea, select") ? target : target.querySelector<HTMLElement>("input, textarea, select");
          target.scrollIntoView({ block: "center", behavior: "smooth" });
          (field ?? target).focus({ preventScroll: true });
        });
        return;
      }
      switchContentView("json");
      // CodeMirror was hidden; let it lay out before selecting and scrolling.
      requestAnimationFrame(() => requestAnimationFrame(() => jumpTo(path)));
      return;
    }
    jumpTo(path);
  };

  // --- Settings that live inside `data` edit the JSON draft directly (one source of truth).
  const updateData = (mutate: (data: Record<string, unknown>) => void) => {
    if (!canEditData) return;
    const next = structuredClone(parsed.data) as Record<string, unknown>;
    mutate(next);
    setText(pretty(next));
  };
  const dataObj = (canEditData ? parsed.data : null) as Record<string, unknown> | null;
  const client = (dataObj?.client ?? {}) as { email?: string };

  // --- Live preview: push the draft to the iframe when it's valid.
  const postPreview = useCallback(() => {
    if (blocked || !iframeRef.current?.contentWindow) return;
    const message: PreviewMessage = { type: "andromeda:preview", data: parsed.data as ProposalDataUnion };
    iframeRef.current.contentWindow.postMessage(message, window.location.origin);
  }, [blocked, parsed]);

  useEffect(() => {
    const timer = setTimeout(postPreview, 400);
    return () => clearTimeout(timer);
  }, [postPreview]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin === window.location.origin && event.data?.type === "andromeda:preview-ready") postPreview();
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [postPreview]);

  // --- Unsaved-changes guard (reloads, closing the tab, external links).
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  // --- Draft persistence (in-app navigation and back/forward).
  // Restore once on mount; deferred so it runs after hydration.
  useEffect(() => {
    const timer = setTimeout(() => {
      const draft = readDraft(proposalId);
      if (!draft) return;
      const same = draft.text === pretty(initial.data) && JSON.stringify(draft.settings) === JSON.stringify(settingsOf(initial));
      if (same) return writeDraft(proposalId, null);
      if (draft.baseRowHash === initial.rowHash) {
        setText(draft.text);
        setSettings(draft.settings);
        setDraftNotice({ kind: "restored", savedAt: draft.savedAt });
      } else {
        setDraftNotice({ kind: "stale", draft });
      }
    }, 0);
    return () => clearTimeout(timer);
    // Mount-only: `initial` is the server snapshot this editor was opened with.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Persist while dirty; clear once clean. Skipped while a stale draft is on
  // offer, so deciding about it isn't pre-empted. Writes are debounced while
  // typing, and whatever is still pending is flushed on unmount (in-app
  // navigation) and `pagehide` (back/forward, reload, closing), so leaving
  // right after an edit can't lose it. `undefined` = nothing pending; `null`
  // = clear the stored draft. Until this editor has stored a draft there's
  // nothing of ours to clear — and clearing on mount would delete the draft
  // the restore step is about to read.
  const pendingDraft = useRef<StoredDraft | null | undefined>(undefined);
  const storedDraft = useRef(false);
  useEffect(() => {
    if (draftNotice?.kind === "stale") return;
    if (!dirty && !storedDraft.current) return;
    pendingDraft.current = dirty ? { baseRowHash: rowHash, text, settings, savedAt: new Date().toISOString() } : null;
    storedDraft.current = dirty;
    const timer = setTimeout(() => flushDraft(proposalId, pendingDraft), 300);
    return () => clearTimeout(timer);
  }, [dirty, text, settings, rowHash, proposalId, draftNotice]);

  useEffect(() => {
    const flush = () => flushDraft(proposalId, pendingDraft);
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [proposalId]);

  // CodeMirror reports changes outside React's event system, so a navigation
  // right after a keystroke can unmount the editor in the same render that
  // would have applied it — the effect above never sees that text. Record it
  // as pending here, synchronously, so the unmount flush has it.
  const onEditorChange = (value: string) => {
    setText(value);
    if (draftNotice?.kind === "stale") return;
    const isDirty = value !== saved.text || JSON.stringify(settings) !== JSON.stringify(saved.settings);
    if (!isDirty && !storedDraft.current) return;
    pendingDraft.current = isDirty ? { baseRowHash: rowHash, text: value, settings, savedAt: new Date().toISOString() } : null;
    storedDraft.current = isDirty;
  };

  /** Clears the stored draft now (after save/discard/reload), cancelling any pending write. */
  const clearStoredDraft = useCallback(() => {
    pendingDraft.current = undefined;
    storedDraft.current = false;
    writeDraft(proposalId, null);
  }, [proposalId]);

  const discardDraft = () => {
    clearStoredDraft();
    setText(saved.text);
    setSettings(saved.settings);
    setDraftNotice(null);
  };

  const restoreStaleDraft = (draft: StoredDraft) => {
    // Saving will then meet the conflict check against the newer sheet row.
    setText(draft.text);
    setSettings(draft.settings);
    setRowHash(draft.baseRowHash);
    setDraftNotice(null);
  };

  const confirmLeave = (event: React.MouseEvent) => {
    // Plain clicks only; let modified clicks (new tab/window) through.
    if (!dirty || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    setLeaveTo(event.currentTarget.getAttribute("href") ?? "/admin");
  };

  const save = useCallback(
    async (options: { confirmAcceptedEdit?: boolean; overrideHash?: string } = {}) => {
      if (blocked) return;
      setSaveState({ kind: "saving" });
      try {
        const res = await fetch(`/api/admin/proposals/${encodeURIComponent(proposalId)}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            expectedRowHash: options.overrideHash ?? rowHash,
            ...settings,
            data: parsed.data,
            confirmAcceptedEdit: options.confirmAcceptedEdit,
          }),
        });
        const body = await res.json().catch(() => ({}));
        if (body.success) {
          setRowHash(body.rowHash);
          setVersion(body.proposalVersion);
          setSaved({ text, settings: { ...settings } });
          clearStoredDraft();
          setSaveState({ kind: "saved", at: new Date() });
        } else if (body.code === "conflict") {
          setSaveState({ kind: "conflict", current: body.current ?? null });
        } else if (body.code === "confirm_accepted_edit") {
          setSaveState({ kind: "confirm_accepted" });
        } else {
          setSaveState({ kind: "error", message: body.error || "Couldn't save.", issues: body.errors });
        }
      } catch {
        setSaveState({ kind: "error", message: "Connection failed. Your changes are still here. Try again." });
      }
    },
    [blocked, proposalId, rowHash, settings, parsed, text, clearStoredDraft]
  );

  // --- Publish revision: save + record + (optionally) email the client.
  const isAccepted = acceptance?.status === "accepted";
  const publishBlockedReason = isAccepted
    ? "Accepted: changes now go through the agreement"
    : blocked
      ? "Fix the errors before publishing"
      : !settings.isActive
        ? "Make the proposal active to publish"
        : null;
  // Already published = the draft's *terms* are the saved version's and that
  // version is published. Compared canonically (as the version hash is), so
  // expiry, operational toggles and JSON formatting don't count as new terms.
  const draftTerms = canEditData ? canonicalProposalJson(parsed.data as object) : null;
  const savedTerms = useMemo(() => {
    const result = parse(saved.text);
    return result.error || !result.data || typeof result.data !== "object" ? null : canonicalProposalJson(result.data as object);
  }, [saved.text]);
  const publishedForDraft = published?.proposalVersion === version && draftTerms !== null && draftTerms === savedTerms ? published : null;
  const diffBase = useMemo(() => {
    if (changeRequestSnapshot) {
      try {
        return { label: "the version the client asked to change", text: pretty(JSON.parse(changeRequestSnapshot)) };
      } catch {
        // Unreadable snapshot: fall back to the saved row.
      }
    }
    return { label: "the version saved on the sheet", text: termsText(initial.data) };
    // The base is fixed for this editor session (the server snapshot it was opened with).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [changeRequestSnapshot]);

  const publish = async (options: PublishOptions) => {
    setPublishing(true);
    setPublishError(null);
    try {
      const nextSettings = options.extendExpiryTo ? { ...settings, expiryDate: options.extendExpiryTo } : settings;
      const res = await fetch(`/api/admin/proposals/${encodeURIComponent(proposalId)}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expectedRowHash: rowHash, ...settings, data: parsed.data, ...options }),
      });
      const body = await res.json().catch(() => ({}));
      if (body.success) {
        setRowHash(body.rowHash);
        setVersion(body.proposalVersion);
        setSettings(nextSettings);
        setSaved({ text, settings: { ...nextSettings } });
        clearStoredDraft();
        setPublished(body.revision);
        setPublishNotice({
          revision: body.revision,
          alreadyPublished: body.alreadyPublished === true,
          // Fallback only (the dialog shouldn't offer a new publish for published terms):
          // a reused revision keeps its original note.
          noteDropped: body.alreadyPublished === true && !options.resendEmail && options.note !== (body.revision.note ?? ""),
        });
        setSaveState({ kind: "saved", at: new Date() });
        setPublishOpen(0);
      } else if (body.code === "conflict") {
        setPublishOpen(0);
        setSaveState({ kind: "conflict", current: body.current ?? null });
      } else {
        setPublishError(body.error || "Couldn't publish.");
      }
    } catch {
      setPublishError("Connection failed. Nothing was published. Try again.");
    } finally {
      setPublishing(false);
    }
  };

  // Cmd/Ctrl+S saves.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        if (dirty) void save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dirty, save]);

  const loadSheetVersion = (current: EditableRow) => {
    const freshText = pretty(current.data);
    const freshSettings = settingsOf(current);
    setText(freshText);
    setSettings(freshSettings);
    setSaved({ text: freshText, settings: freshSettings });
    setRowHash(current.rowHash);
    setVersion(current.proposalVersion);
    clearStoredDraft();
    setSaveState({ kind: "idle" });
  };

  const copy = async (value: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // Clipboard unavailable — nothing to do.
    }
  };

  const title = (dataObj?.title as string) || proposalId;
  const clientName = ((dataObj?.client as { name?: string } | undefined)?.name) || "";

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 border-b border-white/10 light:border-black/10 bg-[var(--andromeda-primary)]/95 backdrop-blur">
        <Link
          href="/admin"
          onClick={confirmLeave}
          aria-label="Back to proposals"
          className="inline-flex items-center gap-1 shrink-0 text-sm text-[var(--andromeda-text-secondary)] hover:text-[var(--andromeda-accent-beige)]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Proposals</span>
        </Link>
        <div className="min-w-0 flex-1">
          <p className="text-sm sm:text-base font-semibold truncate">{clientName ? `${clientName}: ${title}` : title}</p>
          <p className="text-xs text-[var(--andromeda-text-secondary)] font-mono truncate">
            {proposalId}
            <span className="hidden sm:inline"> · version {shortVersion(version)}</span>
          </p>
        </div>
        <div className="hidden sm:block shrink-0">
          <SaveStatus state={saveState} dirty={dirty} />
        </div>
        {isAccepted && (
          <Link
            href={`/admin/proposals/${encodeURIComponent(proposalId)}/agreement`}
            onClick={confirmLeave}
            aria-label="Agreement"
            className="shrink-0 inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold border border-[var(--andromeda-accent-beige)]/50 text-[var(--andromeda-accent-beige)] hover:bg-[var(--andromeda-accent-beige)]/10"
          >
            <FileSignature className="w-4 h-4" />
            <span className="hidden sm:inline">Agreement</span>
          </Link>
        )}
        <button
          type="button"
          onClick={() => {
            setPublishError(null);
            setPublishOpen((n) => n + 1);
          }}
          disabled={!!publishBlockedReason || publishing}
          title={publishBlockedReason ?? "Publish this version as a revision and tell the client"}
          aria-label="Publish revision"
          className="shrink-0 inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold border border-[var(--andromeda-accent-beige)]/50 text-[var(--andromeda-accent-beige)] hover:bg-[var(--andromeda-accent-beige)]/10 disabled:opacity-40"
        >
          {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          <span className="hidden sm:inline">Publish</span>
        </button>
        <button
          type="button"
          onClick={() => void save()}
          disabled={!dirty || blocked || saveState.kind === "saving"}
          title={blocked ? "Fix the errors before saving" : "Save (⌘S)"}
          aria-label={dirty ? "Save (unsaved changes)" : "Save"}
          className="relative shrink-0 inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm font-semibold bg-[var(--andromeda-accent-beige)] text-[var(--andromeda-primary)] hover:bg-[var(--andromeda-accent-beige)]/90 disabled:opacity-40"
        >
          {saveState.kind === "saving" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          <span className="hidden sm:inline">Save</span>
          {/* Phones have no room for the status text — a dot marks unsaved changes. */}
          {dirty && <span aria-hidden className="sm:hidden absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-[var(--andromeda-primary)]" />}
        </button>
      </header>

      <AdminDialog
        open={leaveOpen}
        onClose={() => setLeaveTo(null)}
        title="Leave with unsaved changes?"
        description="Your draft is kept for this browser tab. Come back to this proposal to restore it, or save first."
        actions={
          <>
            <button type="button" onClick={() => setLeaveTo(null)} className={dialogButton.secondary}>
              Keep editing
            </button>
            <button
              type="button"
              onClick={() => {
                setLeaveTo(null);
                router.push(leaveTo ?? "/admin");
              }}
              className={dialogButton.danger}
            >
              Leave
            </button>
            <button
              type="button"
              disabled={blocked}
              title={blocked ? "Fix the errors before saving" : undefined}
              onClick={async () => {
                setLeaveTo(null);
                await save();
              }}
              className={dialogButton.primary}
            >
              Save first
            </button>
          </>
        }
      />

      {publishOpen > 0 && (
        <PublishRevisionDialog
          key={publishOpen}
          open
          onClose={() => setPublishOpen(0)}
          onPublish={(options) => void publish(options)}
          submitting={publishing}
          error={publishError}
          baseLabel={diffBase.label}
          baseText={diffBase.text}
          draftText={canEditData ? termsText(parsed.data as object) : ""}
          clientEmail={(client.email ?? "").trim() || undefined}
          expiryDate={settings.expiryDate}
          published={publishedForDraft}
        />
      )}

      {/* State banners */}
      <div className="px-6 pt-4 space-y-2">
        {draftNotice?.kind === "restored" && (
          <Banner tone="info">
            <span className="flex flex-wrap items-center gap-3">
              Restored your unsaved draft from {new Date(draftNotice.savedAt).toLocaleTimeString()}.
              <button type="button" onClick={() => setDraftNotice(null)} className="underline">
                Keep it
              </button>
              <button type="button" onClick={discardDraft} className="underline text-[var(--andromeda-text-secondary)]">
                Discard draft
              </button>
            </span>
          </Banner>
        )}
        {draftNotice?.kind === "stale" && (
          <Banner tone="warn">
            <span className="flex flex-wrap items-center gap-3">
              You have an unsaved draft from {new Date(draftNotice.draft.savedAt).toLocaleString()}, but the proposal has
              changed since.
              <button type="button" onClick={() => restoreStaleDraft(draftNotice.draft)} className="font-semibold underline">
                Restore draft (you&apos;ll see a conflict on save)
              </button>
              <button type="button" onClick={discardDraft} className="underline text-[var(--andromeda-text-secondary)]">
                Discard draft
              </button>
            </span>
          </Banner>
        )}
        {acceptance?.status === "accepted" && (
          <Banner tone="warn">
            Accepted{acceptance.acceptedAt ? ` on ${new Date(acceptance.acceptedAt).toLocaleDateString()}` : ""}
            {acceptance.proposalVersion ? ` (version ${shortVersion(acceptance.proposalVersion)})` : ""}. Changing its terms
            changes what the client agreed to; saving such a change asks for confirmation.
          </Banner>
        )}
        {acceptance?.status === "counter" && !publishNotice && (
          <Banner tone="info">
            The client requested changes. Save updates their page quietly; <strong>Publish</strong> also records the
            revision, shows them a &ldquo;Revised&rdquo; note and emails them.
            {published?.proposalVersion === version && ` This version was published on ${new Date(published.publishedAt).toLocaleDateString()}.`}
          </Banner>
        )}
        {publishNotice && (
          <Banner tone={publishNotice.revision.email.status === "failed" || publishNotice.noteDropped ? "warn" : "info"}>
            <span className="flex flex-wrap items-center gap-3">
              {publishNotice.alreadyPublished
                ? `Already published on ${new Date(publishNotice.revision.publishedAt).toLocaleString()}`
                : `Published ${new Date(publishNotice.revision.publishedAt).toLocaleTimeString()}`}
              {publishNotice.revision.email.status === "sent" && ` · emailed ${publishNotice.revision.email.to}`}
              {publishNotice.revision.email.status === "skipped" && " · client not emailed"}
              {publishNotice.revision.email.status === "pending" && " · an email for this revision is already being sent, check back in a minute"}
              {publishNotice.revision.email.status === "failed" && ` · the email failed: ${publishNotice.revision.email.error ?? "unknown error"}`}
              {publishNotice.noteDropped && " · these terms were published earlier, so your new note wasn't sent"}
              {publishNotice.revision.email.status === "failed" && (
                <button
                  type="button"
                  onClick={() => {
                    setPublishError(null);
                    setPublishOpen((n) => n + 1);
                  }}
                  className="font-semibold underline"
                >
                  Try again
                </button>
              )}
              <button type="button" onClick={() => setPublishNotice(null)} className="underline text-[var(--andromeda-text-secondary)]">
                Dismiss
              </button>
            </span>
          </Banner>
        )}
        {saveState.kind === "confirm_accepted" && (
          <Banner tone="warn">
            <span className="flex flex-wrap items-center gap-3">
              This edit changes the accepted terms.
              <button type="button" onClick={() => void save({ confirmAcceptedEdit: true })} className="font-semibold underline">
                Save anyway
              </button>
              <button type="button" onClick={() => setSaveState({ kind: "idle" })} className="underline text-[var(--andromeda-text-secondary)]">
                Cancel
              </button>
            </span>
          </Banner>
        )}
        {saveState.kind === "error" && (
          <Banner tone="error">
            {saveState.message}
            {saveState.issues?.length ? ` (${saveState.issues.map((i) => i.path || "root").join(", ")})` : ""}
          </Banner>
        )}
      </div>

      {saveState.kind === "conflict" && (
        <ConflictPanel
          mine={text}
          current={saveState.current}
          onLoad={loadSheetVersion}
          onOverwrite={(hash) => void save({ overrideHash: hash })}
          onCancel={() => setSaveState({ kind: "idle" })}
        />
      )}

      {/* Phones and tablets: one panel at a time */}
      <div role="tablist" aria-label="Editor panels" className="lg:hidden flex gap-1 mx-4 sm:mx-6 mt-4 p-1 rounded-lg bg-[var(--andromeda-secondary)] border border-white/10 light:border-black/10">
        {EDITOR_TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`editor-tab-${id}`}
            aria-selected={tab === id}
            aria-controls={`editor-panel-${id}`}
            onClick={() => setTab(id)}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === id
                ? "bg-[var(--andromeda-accent-beige)]/15 text-[var(--andromeda-accent-beige)]"
                : "text-[var(--andromeda-text-secondary)] hover:text-[var(--andromeda-text-primary)]"
            }`}
          >
            {label}
            {id === "content" && (parsed.error || validation.errors.length > 0) && (
              <span className="min-w-5 px-1.5 rounded-full text-[11px] leading-5 bg-[var(--andromeda-error)]/20 text-[var(--andromeda-error)]">
                {parsed.error ? "!" : validation.errors.length}
              </span>
            )}
            {id === "preview" && blocked && <span aria-label="paused" className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
          </button>
        ))}
      </div>

      {/* Panels are hidden with CSS, not unmounted, so the preview keeps
          receiving the draft and CodeMirror keeps its state between tabs. */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 p-4 sm:p-6 min-h-0">
        {/* Left: settings + editor + issues */}
        <section className="flex flex-col gap-4 min-w-0">
          <div
            id="editor-panel-settings"
            role="tabpanel"
            aria-labelledby="editor-tab-settings"
            className={`${tab === "settings" ? "" : "max-lg:hidden"} grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl border border-white/10 light:border-black/10 bg-[var(--andromeda-secondary)]`}
          >
            <Field label="Visible to client">
              <Toggle checked={settings.isActive} onChange={(v) => setSettings({ ...settings, isActive: v })} on="Active" off="Draft (hidden)" />
            </Field>
            <Field label="Offer valid until">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="date"
                  value={settings.expiryDate}
                  onChange={(e) => setSettings({ ...settings, expiryDate: e.target.value })}
                  className="px-2 py-1.5 rounded bg-[var(--andromeda-primary)] border border-white/10 light:border-black/10 text-sm"
                />
                {[7, 30].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setSettings({ ...settings, expiryDate: extendExpiry(settings.expiryDate, days) })}
                    className="px-2 py-1 rounded text-xs border border-white/10 light:border-black/10 hover:border-[var(--andromeda-accent-beige)]/50"
                  >
                    +{days}d
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Access code">
              <div className="flex items-center gap-2">
                <input
                  value={settings.accessCode}
                  onChange={(e) => setSettings({ ...settings, accessCode: e.target.value })}
                  className="w-36 px-2 py-1.5 rounded bg-[var(--andromeda-primary)] border border-white/10 light:border-black/10 text-sm font-mono"
                />
                <IconButton title="Copy code" onClick={() => copy(settings.accessCode, "code")} done={copied === "code"} />
                <button
                  type="button"
                  title="Generate a new code (the old one stops working once saved)"
                  onClick={() => setSettings({ ...settings, accessCode: randomCode() })}
                  className="p-1.5 rounded hover:bg-[var(--andromeda-accent-beige)]/10"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  title="Copy client link"
                  onClick={() => copy(clientLink, "link")}
                  className="text-xs text-[var(--andromeda-text-secondary)] hover:text-[var(--andromeda-accent-beige)]"
                >
                  {copied === "link" ? "Link copied" : "Copy link"}
                </button>
              </div>
            </Field>
            <Field label="Client email (tracker + updates)">
              <input
                type="email"
                value={client.email ?? ""}
                disabled={!canEditData}
                onChange={(e) =>
                  updateData((d) => {
                    const c = { ...((d.client as object) ?? {}) } as Record<string, unknown>;
                    if (e.target.value) c.email = e.target.value;
                    else delete c.email;
                    d.client = c;
                  })
                }
                className="w-full px-2 py-1.5 rounded bg-[var(--andromeda-primary)] border border-white/10 light:border-black/10 text-sm disabled:opacity-50"
              />
            </Field>
            {/* Saved immediately to the EngagementState tab, not the JSON draft. */}
            <EngagementSwitches
              proposalId={proposalId}
              data={(dataObj ?? {}) as GateInputs}
              initial={engagement}
              onLegacyFlagsSuperseded={() =>
                updateData((d) => {
                  delete d.assetsReady;
                  delete d.trackerReady;
                })
              }
            />
          </div>

          <div
            id="editor-panel-content"
            role="tabpanel"
            aria-labelledby="editor-tab-content"
            className={`${tab === "content" ? "" : "max-lg:hidden"} flex flex-col gap-4 min-w-0`}
          >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--andromeda-text-secondary)]">Content</h2>
            <div className="flex items-center gap-3">
              {contentView === "json" && (
                <button
                  type="button"
                  disabled={!!parsed.error}
                  onClick={() => setText(pretty(parsed.data))}
                  className="inline-flex items-center gap-1 text-xs text-[var(--andromeda-text-secondary)] hover:text-[var(--andromeda-accent-beige)] disabled:opacity-40"
                >
                  <Wand2 className="w-3.5 h-3.5" /> Format
                </button>
              )}
              <div role="radiogroup" aria-label="Content view" className="flex gap-1 p-0.5 rounded-lg bg-[var(--andromeda-secondary)] border border-white/10 light:border-black/10">
                {(["form", "json"] as const).map((view) => (
                  <button
                    key={view}
                    type="button"
                    role="radio"
                    aria-checked={contentView === view}
                    onClick={() => switchContentView(view)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium ${
                      contentView === view
                        ? "bg-[var(--andromeda-accent-beige)]/15 text-[var(--andromeda-accent-beige)]"
                        : "text-[var(--andromeda-text-secondary)] hover:text-[var(--andromeda-text-primary)]"
                    }`}
                  >
                    {view === "form" ? "Form" : "JSON"}
                  </button>
                ))}
              </div>
            </div>
          </div>
          {contentView === "form" &&
            (canEditData ? (
              <div className="p-4 rounded-xl border border-white/10 light:border-black/10 bg-[var(--andromeda-secondary)]">
                <FormErrorBoundary resetKey={text} onShowJson={() => switchContentView("json")}>
                  <SectionForms
                    data={parsed.data as Record<string, unknown>}
                    errors={validation.errors}
                    acceptance={acceptance}
                    onChange={updateData}
                    onShowInJson={jumpToIssue}
                  />
                </FormErrorBoundary>
              </div>
            ) : (
              <div role="alert" className="p-4 rounded-xl border border-[var(--andromeda-error)]/30 bg-[var(--andromeda-error)]/5 text-sm">
                The JSON has a syntax error, so the form can&apos;t read it.{" "}
                <button type="button" onClick={() => switchContentView("json")} className="underline hover:text-[var(--andromeda-accent-beige)]">
                  Fix it in the JSON view
                </button>
                .
              </div>
            ))}
          {/* Hidden, not unmounted, in Form view: keeps CodeMirror's undo history and cursor. */}
          <div className={`${contentView === "json" ? "" : "hidden"} rounded-xl overflow-hidden border border-white/10 light:border-black/10 text-[13px]`}>
            <CodeMirror
              ref={editorRef}
              value={text}
              onChange={onEditorChange}
              extensions={extensions}
              theme={oneDark}
              height="60vh"
              basicSetup={{ foldGutter: true, highlightActiveLine: true }}
            />
          </div>

          <IssuesList parseError={parsed.error} errors={validation.errors} warnings={validation.warnings} onJump={jumpToIssue} />
          </div>
        </section>

        {/* Right: live preview */}
        <section
          id="editor-panel-preview"
          role="tabpanel"
          aria-labelledby="editor-tab-preview"
          className={`${tab === "preview" ? "" : "max-lg:hidden"} flex flex-col gap-3 min-w-0`}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--andromeda-text-secondary)]">
              Live preview {blocked && <span className="normal-case tracking-normal text-amber-500">· paused until errors are fixed</span>}
            </h2>
            {/* On phones the preview is already phone-width. */}
            <div className="hidden lg:flex gap-1">
              {(["desktop", "mobile"] as const).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setPreviewWidth(w)}
                  title={w === "desktop" ? "Desktop width" : "Phone width"}
                  className={`p-1.5 rounded ${previewWidth === w ? "bg-[var(--andromeda-accent-beige)]/15 text-[var(--andromeda-accent-beige)]" : "text-[var(--andromeda-text-secondary)]"}`}
                >
                  {w === "desktop" ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 flex justify-center rounded-xl border border-white/10 light:border-black/10 bg-black/20 overflow-hidden min-h-[70vh]">
            <iframe
              ref={iframeRef}
              src={`/admin/proposals/${encodeURIComponent(proposalId)}/preview`}
              title="Proposal preview"
              className="w-full h-full min-h-[70vh] bg-[var(--andromeda-primary)]"
              style={{ maxWidth: previewWidth === "mobile" ? 390 : undefined }}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function settingsOf(row: EditableRow): Settings {
  return { accessCode: row.accessCode, expiryDate: row.expiryDate, isActive: row.isActive };
}

function SaveStatus({ state, dirty }: { state: SaveState; dirty: boolean }) {
  if (state.kind === "saving") return <span className="text-xs text-[var(--andromeda-text-secondary)]">Saving…</span>;
  if (dirty) return <span className="text-xs text-amber-500">Unsaved changes</span>;
  if (state.kind === "saved") return <span className="text-xs text-[var(--andromeda-success)]">Saved {state.at.toLocaleTimeString()}</span>;
  return null;
}

function Banner({ tone, children }: { tone: "info" | "warn" | "error"; children: React.ReactNode }) {
  const styles = {
    info: "bg-[var(--andromeda-highlight)]/10 border-[var(--andromeda-highlight)]/30",
    warn: "bg-amber-500/10 border-amber-500/30",
    error: "bg-[var(--andromeda-error)]/10 border-[var(--andromeda-error)]/30",
  }[tone];
  return (
    <div role={tone === "error" ? "alert" : undefined} className={`flex items-start gap-2 px-4 py-3 rounded-lg border text-sm ${styles}`}>
      <AlertTriangle className={`w-4 h-4 mt-0.5 shrink-0 ${tone === "info" ? "text-[var(--andromeda-highlight)]" : tone === "warn" ? "text-amber-500" : "text-[var(--andromeda-error)]"}`} />
      <div>{children}</div>
    </div>
  );
}

function IconButton({ title, onClick, done }: { title: string; onClick: () => void; done: boolean }) {
  return (
    <button type="button" title={title} onClick={onClick} className="p-1.5 rounded hover:bg-[var(--andromeda-accent-beige)]/10">
      {done ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}

function IssuesList({
  parseError,
  errors,
  warnings,
  onJump,
}: {
  parseError: string | null;
  errors: ProposalIssue[];
  warnings: ProposalIssue[];
  onJump: (path: string) => void;
}) {
  if (parseError) {
    return (
      <p className="flex items-start gap-2 text-sm text-[var(--andromeda-error)]">
        <XCircle className="w-4 h-4 mt-0.5 shrink-0" /> Invalid JSON: {parseError}
      </p>
    );
  }
  if (!errors.length && !warnings.length) {
    return (
      <p className="flex items-center gap-2 text-sm text-[var(--andromeda-success)]">
        <Check className="w-4 h-4" /> Valid: no problems found.
      </p>
    );
  }
  return (
    <ul className="space-y-1 text-sm max-h-56 overflow-y-auto">
      {[...errors.map((i) => ({ ...i, error: true })), ...warnings.map((i) => ({ ...i, error: false }))].map((issue, index) => (
        <li key={`${issue.path}-${index}`}>
          <button type="button" onClick={() => onJump(issue.path)} className="w-full text-left flex items-start gap-2 px-2 py-1 rounded hover:bg-white/5 light:hover:bg-black/5">
            {issue.error ? (
              <XCircle className="w-4 h-4 mt-0.5 shrink-0 text-[var(--andromeda-error)]" />
            ) : (
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-amber-500" />
            )}
            <span>
              <code className="font-mono text-xs">{issue.path || "(root)"}</code>{" "}
              <span className="text-[var(--andromeda-text-secondary)]">{issue.message}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function ConflictPanel({
  mine,
  current,
  onLoad,
  onOverwrite,
  onCancel,
}: {
  mine: string;
  current: EditableRow | null;
  onLoad: (current: EditableRow) => void;
  onOverwrite: (hash: string) => void;
  onCancel: () => void;
}) {
  const sheetSettings = current
    ? `Sheet settings now: code ${current.accessCode}, expires ${current.expiryDate}, ${current.isActive ? "active" : "draft"}.`
    : "";
  return (
    <div className="mx-6 mt-4 p-4 rounded-xl border border-amber-500/40 bg-amber-500/5">
      <p className="font-semibold mb-1">The sheet changed since you opened this proposal</p>
      <p className="text-sm text-[var(--andromeda-text-secondary)] mb-3">
        Someone (or you, on the sheet) saved a different version. Compare below: <span className="text-[var(--andromeda-error)]">−</span> is
        the sheet, <span className="text-[var(--andromeda-success)]">+</span> is yours. {sheetSettings}
      </p>
      {current ? (
        <div className="mb-3">
          <DiffView before={pretty(current.data)} after={mine} empty="Content is identical; only settings differ." />
        </div>
      ) : (
        <p className="text-sm mb-3">The row could no longer be read.</p>
      )}
      <div className="flex flex-wrap gap-3 text-sm">
        {current && (
          <>
            <button type="button" onClick={() => onLoad(current)} className="px-3 py-1.5 rounded border border-white/15 light:border-black/15 hover:border-[var(--andromeda-accent-beige)]/50">
              Discard mine, load sheet version
            </button>
            <button type="button" onClick={() => onOverwrite(current.rowHash)} className="px-3 py-1.5 rounded bg-amber-500/20 hover:bg-amber-500/30 font-semibold">
              Overwrite sheet with mine
            </button>
          </>
        )}
        <button type="button" onClick={onCancel} className="px-3 py-1.5 text-[var(--andromeda-text-secondary)]">
          Close
        </button>
      </div>
    </div>
  );
}
