"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

export type DraftData = Record<string, string>;

/**
 * Bump the version when the stored shape changes: drafts under any other
 * version are purged on the next page load instead of being restored.
 */
const DRAFT_NAMESPACE = "bade:draft:";
const PREFIX = `${DRAFT_NAMESPACE}v2:`;
/** Unfinished work older than this is dropped rather than resurfacing weeks later. */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const SAVE_DELAY_MS = 400;

interface StoredDraft {
  savedAt: number;
  /** `updated_at` of the record the edit started from; null when creating. */
  base: string | null;
  /** The form as it first loaded, so only fields the user actually changed are restored. */
  initial: DraftData;
  data: DraftData;
  /** Set while a save is in flight; cleared again if the save fails. */
  submitting?: boolean;
}

/**
 * Storage key for a form. Edits are keyed by record id; new records by whatever
 * they were started from (a quotation, a vehicle), so starting an invoice from a
 * different quotation never picks up another quotation's half-finished invoice.
 */
export function draftKey(
  kind: string,
  id?: string | null,
  context?: Record<string, string | null | undefined>,
): string {
  if (id) return `${kind}:${id}`;
  const parts = Object.entries(context ?? {})
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${v}`);
  return [kind, "new", ...parts].join(":");
}

/** Removes every saved draft, e.g. on sign-out so the next person on this computer starts clean. */
export function clearAllDrafts() {
  removeWhere((k) => k.startsWith(DRAFT_NAMESPACE));
}

export function useFormDraft({
  storageKey,
  formRef,
  restore,
  deps = [],
  version,
  actionState,
  enabled = true,
}: {
  /** Build with `draftKey()`. */
  storageKey: string;
  formRef: React.RefObject<HTMLFormElement | null>;
  /**
   * Puts restored values back into the form's React state (line items, party,
   * vehicle…). `data` is the full form with the draft applied over it; `changed`
   * names the fields the draft actually changed.
   */
  restore?: (data: DraftData, changed: ReadonlySet<string>) => void;
  /** React state that isn't typed into a field directly — saving on change. */
  deps?: unknown[];
  /** `record.updated_at` when editing. A draft started from an older version is dropped. */
  version?: string | null;
  /** The `useActionState` result, so a failed save keeps the draft and a successful one clears it. */
  actionState?: { error?: string; fieldErrors?: unknown };
  enabled?: boolean;
}) {
  const key = useRef(PREFIX + storageKey);
  const base = useRef(version ?? null);
  const s = useRef<{
    phase: "editing" | "submitting" | "discarded";
    /** The form as it loaded. Matching it again means there is nothing to keep. */
    baseline: DraftData | null;
    /** The form as it was submitted, to undo React's post-submit reset if the save fails. */
    submitted: DraftData | null;
    timer: ReturnType<typeof setTimeout> | null;
    sawDeps: boolean;
  }>({ phase: "editing", baseline: null, submitted: null, timer: null, sawDeps: false });
  const [restoredAt, setRestoredAt] = useState<number | null>(null);

  function persist(form: HTMLFormElement | null, submitting = false) {
    if (form) persistData(readForm(form), submitting);
  }

  function persistData(data: DraftData, submitting = false) {
    const st = s.current;
    if (!st.baseline) return;
    if (changedKeys(st.baseline, data).size === 0) {
      removeStored(key.current);
      return;
    }
    writeStored(key.current, {
      savedAt: Date.now(),
      base: base.current,
      initial: st.baseline,
      data,
      ...(submitting && { submitting: true }),
    });
  }

  function cancelPendingSave() {
    const st = s.current;
    if (!st.timer) return false;
    clearTimeout(st.timer);
    st.timer = null;
    return true;
  }

  function scheduleSave() {
    if (!enabled || s.current.phase !== "editing") return;
    cancelPendingSave();
    s.current.timer = setTimeout(() => {
      s.current.timer = null;
      if (s.current.phase === "editing") persist(formRef.current);
    }, SAVE_DELAY_MS);
  }

  /** Writes a save that is still waiting on the debounce, e.g. when leaving the page. */
  function flush(form: HTMLFormElement) {
    if (cancelPendingSave() && s.current.phase === "editing") persist(form);
  }

  // Restore once, after hydration (client-only, so no hydration mismatch).
  useEffect(() => {
    const form = formRef.current;
    const st = s.current;
    if (!enabled || !form || st.baseline) return;
    purgeExpiredDrafts();

    const initial = readForm(form);
    st.baseline = initial;

    const stored = readStored(key.current);
    if (!stored) return;
    const usable =
      stored.base === base.current &&
      Date.now() - stored.savedAt <= MAX_AGE_MS &&
      // Closed mid-save while creating: it most likely went through, and restoring
      // it would invite a duplicate. (Edits are settled by the version check.)
      !(stored.submitting && base.current === null);
    const changed = usable ? changedKeys(stored.initial, stored.data) : new Set<string>();
    if (changed.size === 0) {
      removeStored(key.current);
      return;
    }

    // Untouched fields keep today's values — a fresh document number, the
    // record's current data — and only the user's own changes come back.
    const merged: DraftData = { ...initial };
    for (const k of changed) {
      if (k in stored.data) merged[k] = stored.data[k];
      else delete merged[k];
    }
    restore?.(merged, changed);
    applyToForm(form, merged, changed);
    // Again once restored state has rendered, for fields that only appear then.
    setTimeout(() => {
      if (formRef.current) applyToForm(formRef.current, merged, changed);
      setRestoredAt(stored.savedAt);
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save while typing; on submit, stop saving so a late save can't bring the draft back.
  useEffect(() => {
    const form = formRef.current;
    if (!enabled || !form) return;
    const path = window.location.pathname;
    // Both refs hold the same value for the form's whole life; captured for the cleanup.
    const st = s.current;
    const storageKey = key.current;

    const onEdit = () => scheduleSave();
    const onSubmit = () => {
      if (st.phase !== "editing") return;
      // Blurring the last field fires `change` just before this, so a save is
      // usually pending here; it must not run after the save succeeds.
      cancelPendingSave();
      st.submitted = readForm(form);
      persist(form, true);
      st.phase = "submitting";
    };
    const onPageHide = () => flush(form);

    form.addEventListener("input", onEdit);
    form.addEventListener("change", onEdit);
    form.addEventListener("submit", onSubmit);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      form.removeEventListener("input", onEdit);
      form.removeEventListener("change", onEdit);
      form.removeEventListener("submit", onSubmit);
      window.removeEventListener("pagehide", onPageHide);

      if (st.phase === "submitting") {
        // Next updates the URL before this cleanup runs, so a new path means the
        // save redirected (succeeded). Same path: it threw (e.g. no network) — keep the work.
        if (window.location.pathname !== path) removeStored(storageKey);
        else persistData(st.submitted ?? readForm(form));
      } else {
        flush(form);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // Save when controlled state changes (the first run is just the initial render).
  useEffect(() => {
    if (!enabled) return;
    if (!s.current.sawDeps) {
      s.current.sawDeps = true;
      return;
    }
    scheduleSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // A save came back without leaving the page. Layout effect: runs before paint.
  useLayoutEffect(() => {
    const st = s.current;
    const form = formRef.current;
    if (!actionState || st.phase !== "submitting" || !form) return;
    st.phase = "editing";
    const submitted = st.submitted;
    st.submitted = null;

    if (actionState.error || actionState.fieldErrors) {
      // React resets uncontrolled fields after every form action, failed or
      // not, so put back what the user typed, then keep it as the draft.
      if (submitted) applyToForm(form, submitted, changedKeys(readForm(form), submitted));
      persist(form);
    } else {
      // Saved in place: what's on screen is now the saved state.
      removeStored(key.current);
      st.baseline = readForm(form);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionState]);

  /** Throws the restored changes away and reloads the form as saved. */
  function discard() {
    s.current.phase = "discarded";
    cancelPendingSave();
    removeStored(key.current);
    window.location.reload();
  }

  return { restoredAt, discard };
}

/* ------------------------------------------------------------------ */

function readForm(form: HTMLFormElement): DraftData {
  const out: DraftData = {};
  for (const [k, v] of new FormData(form).entries()) if (typeof v === "string") out[k] = v;
  return out;
}

function changedKeys(from: DraftData, to: DraftData): Set<string> {
  const keys = new Set<string>();
  for (const k of new Set([...Object.keys(from), ...Object.keys(to)])) {
    if (from[k] !== to[k]) keys.add(k);
  }
  return keys;
}

/**
 * Sets uncontrolled fields straight on the DOM. Hidden inputs are skipped: they
 * mirror React state, which `restore` puts back.
 */
function applyToForm(form: HTMLFormElement, data: DraftData, keys: Iterable<string>) {
  for (const k of keys) {
    const item = form.elements.namedItem(k);
    if (!item) continue;
    const els = item instanceof RadioNodeList ? Array.from(item) : [item];
    for (const el of els) {
      if (el instanceof HTMLInputElement) {
        if (el.type === "hidden" || el.type === "file") continue;
        if (el.type === "checkbox" || el.type === "radio") el.checked = data[k] === el.value;
        else el.value = data[k] ?? "";
      } else if (el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) {
        el.value = data[k] ?? "";
      }
    }
  }
}

function readStored(key: string): StoredDraft | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const d = JSON.parse(raw) as StoredDraft;
    return d && typeof d.savedAt === "number" && d.data && d.initial ? d : null;
  } catch {
    return null;
  }
}

function writeStored(key: string, draft: StoredDraft) {
  try {
    localStorage.setItem(key, JSON.stringify(draft));
  } catch {
    /* storage full or unavailable — ignore */
  }
}

function removeStored(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function removeWhere(test: (key: string) => boolean) {
  try {
    const doomed: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && test(k)) doomed.push(k);
    }
    for (const k of doomed) localStorage.removeItem(k);
  } catch {
    /* ignore */
  }
}

let purged = false;

/** Once per page load: drop drafts from older versions and ones past their age. */
function purgeExpiredDrafts() {
  if (purged) return;
  purged = true;
  const now = Date.now();
  removeWhere((k) => {
    if (!k.startsWith(DRAFT_NAMESPACE)) return false;
    if (!k.startsWith(PREFIX)) return true;
    const d = readStored(k);
    return !d || now - d.savedAt > MAX_AGE_MS;
  });
}
