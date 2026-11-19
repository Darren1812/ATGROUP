"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import InventoryFormModal from "@/components/quotation/InventoryFormModal";
import {
  ApiError,
  ImportResult,
  QuotationInventory,
  SaveDto,
  createInventory,
  deleteInventory,
  exportUrl,
  importInventory,
  listInventory,
  listTypes,
  updateInventory,
} from "@/lib/quotationInventoryApi";
import { Copy, Pencil, Trash2 } from "lucide-react";

const PAGE_SIZE = 50;
function formatPrice(value: number | null) {
  if (value === null) return "—";
  return value.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function InventoryPage() {
  const [items, setItems] = useState<QuotationInventory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [formState, setFormState] = useState<{
    item: QuotationInventory | null;
    mode: "create" | "edit" | "duplicate";
  } | null>(null);
  const [importing, setImporting] = useState(false);
  const [importOk, setImportOk] = useState<ImportResult | null>(null);
  const [importErr, setImportErr] = useState<{ message: string; errors?: string[] } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [typeOptions, setTypeOptions] = useState<string[]>([]);   // 放这里


  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await listInventory({ search, type, page, pageSize: PAGE_SIZE });
      setItems(result.items);
      setTotal(result.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load inventory.");
    } finally {
      setLoading(false);
    }
  }, [search, type, page]);

  useEffect(() => {
    load();
  }, [load, reloadKey]);

  useEffect(() => {
    listTypes()
      .then((types) => {
        setTypeOptions(types);
        // 如果当前选中的 Type 已经不存在(例如被删光或重新导入后),自动回到 All types
        setType((current) => (current && !types.includes(current) ? "" : current));
      })
      .catch(() => setTypeOptions([]));
  }, [reloadKey]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function handleSave(dto: SaveDto) {
    if (formState?.mode === "edit" && formState.item) await updateInventory(formState.item.id, dto);
    else await createInventory(dto);
    setFormState(null);
    setReloadKey((key) => key + 1);
  }

  async function handleDelete(item: QuotationInventory) {
    if (!confirm(`Delete “${item.productCode || item.productName || "this item"}”?`)) return;
    try {
      await deleteInventory(item.id);
      setReloadKey((key) => key + 1);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Unable to delete this item.");
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const confirmed = confirm("Importing this Excel file will replace all existing inventory records. Continue?");
    if (!confirmed) {
      e.target.value = "";
      return;
    }
    setImporting(true);
    setImportOk(null);
    setImportErr(null);
    try {
      setImportOk(await importInventory(file));
      setSearchInput("");
      setSearch("");
      setType("");
      setPage(1);
      setReloadKey((key) => key + 1);
    } catch (err) {
      if (err instanceof ApiError) setImportErr({ message: err.message, errors: err.errors });
      else setImportErr({ message: "Import failed. Please try again." });
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  const buttonClass = "inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/quotation" className="mb-3 inline-flex text-sm font-medium text-slate-500 transition hover:text-orange-600">← Quotation</Link>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Quotation inventory</h1>
          <p className="mt-1 text-sm text-slate-500">Manage products, pricing and quotation notes.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input ref={fileRef} type="file" accept=".xlsx" className="hidden" onChange={handleImport} />
          <button onClick={() => fileRef.current?.click()} disabled={importing} className={buttonClass}>
            {importing ? "Replacing inventory…" : "Import Excel"}
          </button>
          <a href={exportUrl(type || undefined)} className={buttonClass}>Export Excel</a>
          <button onClick={() => setFormState({ item: null, mode: "create" })} className="inline-flex items-center justify-center rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700">Add item</button>
        </div>
      </div>

      {(importOk || importErr) && (
        <div role="status" className={`mb-5 rounded-xl border px-4 py-3 text-sm ${importErr ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
          <p className="font-medium">{importErr?.message ?? importOk?.message}</p>
          {importErr?.errors && <ul className="mt-2 max-h-48 list-disc space-y-1 overflow-y-auto pl-5">{importErr.errors.map((message, i) => <li key={i}>{message}</li>)}</ul>}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4 sm:p-5">
          <div className="flex flex-1 flex-wrap gap-3">
            <label className="min-w-[230px] flex-1 sm:max-w-sm">
              <span className="sr-only">Search inventory</span>
              <input value={searchInput} onChange={(e) => setSearchInput(e.target.value)} placeholder="Search by product code or name" className="w-full rounded-lg border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
            </label>
            <label>
              <span className="sr-only">Filter by type</span>
              <select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }} className="h-full min-h-10 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100">
                <option value="">All types</option>
                {typeOptions.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
          </div>
          <p className="text-sm text-slate-500"><span className="font-semibold text-slate-800">{total}</span> {total === 1 ? "item" : "items"}</p>
        </div>

        {error && <p role="alert" className="m-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Type</th>
                <th className="px-5 py-3 font-semibold">Product code</th>
                <th className="px-5 py-3 font-semibold">Product name</th>
                <th className="px-5 py-3 text-right font-semibold">List price</th>
                <th className="px-5 py-3 font-semibold">Additional information</th>
                <th className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item) => (
                <tr key={item.id} className="align-top transition hover:bg-orange-50/30">
                  <td className="px-5 py-4 text-slate-600">{item.itemType || "—"}</td>
                  <td className="px-5 py-4 font-medium text-slate-800">{item.productCode || "—"}</td>
                  <td className="max-w-sm whitespace-pre-line px-5 py-4 text-slate-700">{item.productName || <span className="italic text-slate-400">No product name</span>}</td>
                  <td className={`px-5 py-4 text-right tabular-nums ${((item.listPrice ?? 0) < 0) ? "text-red-600" : "text-slate-700"}`}>{formatPrice(item.listPrice)}</td>
                  <td className="max-w-xs whitespace-pre-line px-5 py-4 text-slate-500">{item.additionalInfo || "—"}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button onClick={() => setFormState({ item, mode: "edit" })} title="Edit item" aria-label={`Edit ${item.productCode || item.productName || "item"}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-orange-50 hover:text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"><Pencil size={16} /></button>
                      <button onClick={() => setFormState({ item, mode: "duplicate" })} title="Duplicate item" aria-label={`Duplicate ${item.productCode || item.productName || "item"}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"><Copy size={16} /></button>
                      <button onClick={() => handleDelete(item)} title="Delete item" aria-label={`Delete ${item.productCode || item.productName || "item"}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {loading && <tr><td colSpan={6} className="px-5 py-14 text-center text-slate-500">Loading inventory…</td></tr>}
              {!loading && !error && items.length === 0 && <tr><td colSpan={6} className="px-5 py-14 text-center"><p className="font-medium text-slate-700">No inventory items found</p><p className="mt-1 text-sm text-slate-500">Try a different search or add an item.</p></td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500 sm:px-5">
          <span>Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)} className={buttonClass}>Previous</button>
            <button disabled={page >= totalPages || loading} onClick={() => setPage((current) => current + 1)} className={buttonClass}>Next</button>
          </div>
        </div>
      </section>

      {formState && <InventoryFormModal item={formState.item} mode={formState.mode} onClose={() => setFormState(null)} onSave={handleSave} />}
    </main>
  );
}
