"use client";

import { useEffect, useRef } from "react";

export type DraftData = Record<string, string>;

/**
 * Auto-saves a form's fields to localStorage (debounced) and restores them once
 * on mount, so a page refresh while creating/editing keeps the work as a draft.
 *
 * - Uncontrolled inputs are restored generically by setting their DOM value.
 * - Controlled React state (line items, party, etc.) is restored via the
 *   `restore` callback the form provides.
 * - Serialization reads the whole form via FormData, so every named field
 *   (including the hidden line-items JSON) is captured.
 */
export function useFormDraft({
  storageKey,
  formRef,
  restore,
  deps = [],
  enabled = true,
}: {
  storageKey: string;
  formRef: React.RefObject<HTMLFormElement | null>;
  restore?: (data: DraftData) => void;
  deps?: unknown[];
  enabled?: boolean;
}) {
  const didRestore = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstDep = useRef(true);

  const save = () => {
    if (!enabled || !formRef.current) return;
    try {
      const fd = new FormData(formRef.current);
      const obj: DraftData = {};
      for (const [k, v] of fd.entries()) if (typeof v === "string") obj[k] = v;
      localStorage.setItem(storageKey, JSON.stringify(obj));
    } catch {
      /* storage unavailable — ignore */
    }
  };

  const clear = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      /* ignore */
    }
  };

  const scheduleSave = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(save, 400);
  };

  // Restore once, after hydration (client-only → no hydration mismatch).
  useEffect(() => {
    if (!enabled || didRestore.current) return;
    didRestore.current = true;
    let data: DraftData | null = null;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) data = JSON.parse(raw) as DraftData;
    } catch {
      data = null;
    }
    if (!data) return;

    restore?.(data);

    // Restore uncontrolled DOM fields on the next frame (after React renders).
    requestAnimationFrame(() => {
      const form = formRef.current;
      if (!form) return;
      for (const [k, v] of Object.entries(data)) {
        if (k === "items") continue; // handled by controlled state
        const el = form.elements.namedItem(k) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
        if (el && "value" in el) el.value = v;
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save on user typing (covers uncontrolled fields).
  useEffect(() => {
    const form = formRef.current;
    if (!form || !enabled) return;
    const onInput = () => scheduleSave();
    form.addEventListener("input", onInput);
    form.addEventListener("change", onInput);
    return () => {
      form.removeEventListener("input", onInput);
      form.removeEventListener("change", onInput);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  // Save when controlled state changes (skip the initial render).
  useEffect(() => {
    if (!enabled) return;
    if (firstDep.current) {
      firstDep.current = false;
      return;
    }
    scheduleSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { clear, save };
}
