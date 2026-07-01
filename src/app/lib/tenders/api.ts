"use client";

import { useEffect, useState } from "react";
import type { TenderRow } from "@/app/types/tender";

/**
 * Point this at your backend if the frontend isn't served from the same
 * origin (e.g. Next.js dev server on :3000, API on :5001).
 * Set NEXT_PUBLIC_API_BASE_URL in .env.local. Leave unset for same-origin.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export async function fetchTenders(): Promise<TenderRow[]> {
  const res = await fetch(`${API_BASE}/api/MdTable`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load tenders (HTTP ${res.status})`);
  return (await res.json()) as TenderRow[];
}

export interface UseTenderDataResult {
  rows: TenderRow[];
  loading: boolean;
  error: string | null;
  /** Call to manually re-fetch, e.g. after the user adds/edits a record. */
  refetch: () => void;
}

/**
 * Central data hook for the dashboard. All tabs consume the same rows,
 * filtered client-side — see src/lib/tenders/utils.ts for the filtering
 * and aggregation helpers.
 *
 * If the dataset grows large, swap this for server-side filtering
 * (pass filters as query params to /api/MdTable) without touching any
 * of the tab components — they only care about the returned TenderRow[].
 */
export function useTenderData(): UseTenderDataResult {
  const [rows, setRows] = useState<TenderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchTenders()
      .then((data) => { if (!cancelled) setRows(data); })
      .catch((err: unknown) => { if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load tenders"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [reloadToken]);

  return { rows, loading, error, refetch: () => setReloadToken((t) => t + 1) };
}