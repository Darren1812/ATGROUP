"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { ArrowDownToLine, Eye, FileText, LoaderCircle, PackagePlus, Search, Trash2, X } from "lucide-react";
import { listInventory, QuotationInventory } from "@/lib/quotationInventoryApi";
import { generateQuotation, previewQuotation, type QuotationGenerateDto } from "@/lib/quotationApi";
import { useAuth } from "@/context/AuthContext";

type QuotationLine = { inventoryId: number; qty: number; months: string };

const fieldClass = "mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100";

function todayAsInputValue() {
  const date = new Date();
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

function money(value: number | null | undefined) {
  if (value == null) return "Price not set";
  return `RM ${value.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getReferenceCompany(template: QuotationGenerateDto["template"]) {
  return template.replace(/_(RENT|PURCHASE)$/, "");
}

function getReferencePrefix(template: QuotationGenerateDto["template"], date: string): string | null {
  const [year = "", month = ""] = date.split("-");
  const yy = year.slice(-2);
  const mm = month.padStart(2, "0");

  if (template.startsWith("ATP_")) return `QUC${yy}/`;
  if (template.startsWith("ASN_")) return `K${yy}${mm}/`;
  if (template.startsWith("GC_")) return `GCM${yy}${mm}/`;
  if (template.startsWith("ARENA_")) return `QA${yy}`;
  if (template.startsWith("SKYACTIVE_")) return `SQ${yy}`;
  if (template.startsWith("ALLTIME_")) return `ALL${yy}${mm}.`;
  if (template.startsWith("ATPLAN_")) return `QUO.${mm}`;
  return null;
}

export default function QuotationPage() {
  const { user } = useAuth();
  const [inventory, setInventory] = useState<QuotationInventory[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [template, setTemplate] = useState<QuotationGenerateDto["template"]>("ATP_RENT");
  const [customerName, setCustomerName] = useState("");
  const [address, setAddress] = useState("");
  const [attention, setAttention] = useState("");
  const [tel, setTel] = useState("");
  const [referenceSequence, setReferenceSequence] = useState("");
  const [manualReference, setManualReference] = useState("");
  const [date, setDate] = useState(todayAsInputValue);
  const [salesPerson, setSalesPerson] = useState("");
  const [lines, setLines] = useState<QuotationLine[]>([]);
  const [previewing, setPreviewing] = useState(false);
  const [exporting, setExporting] = useState<"pdf" | "docx" | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewPayload, setPreviewPayload] = useState<QuotationGenerateDto | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportMessage, setExportMessage] = useState<string | null>(null);
  const [exportDestination, setExportDestination] = useState<"download" | "synology">("download");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function loadInventory() {
      setInventoryLoading(true);
      setInventoryError(null);
      try {
        const firstPage = await listInventory({ page: 1, pageSize: 200 });
        let allItems = firstPage.items;
        const pageCount = Math.ceil(firstPage.total / firstPage.pageSize);
        if (pageCount > 1) {
          const remainingPages = await Promise.all(
            Array.from({ length: pageCount - 1 }, (_, index) =>
              listInventory({ page: index + 2, pageSize: firstPage.pageSize })
            )
          );
          allItems = allItems.concat(...remainingPages.map((page) => page.items));
        }
        if (active) setInventory(allItems);
      } catch (err) {
        if (active) setInventoryError(err instanceof Error ? err.message : "Unable to load inventory.");
      } finally {
        if (active) setInventoryLoading(false);
      }
    }
    loadInventory();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!previewUrl) return;
    return () => URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const filteredInventory = useMemo(() => {
    const query = productSearch.trim().toLocaleLowerCase();
    if (!query) return inventory.slice(0, 80);
    return inventory.filter((item) =>
      [item.productCode, item.productName, item.itemType]
        .some((value) => value?.toLocaleLowerCase().includes(query))
    ).slice(0, 80);
  }, [inventory, productSearch]);

  const selectedItems = useMemo(() => lines.map((line) => ({
    ...line,
    item: inventory.find((candidate) => candidate.id === line.inventoryId),
  })), [inventory, lines]);

  const isRental = template.endsWith("RENT");
  const isAsn = template.startsWith("ASN_");
  const referencePrefix = getReferencePrefix(template, date);
  const quotationReference = referencePrefix === null
    ? manualReference.trim()
    : `${referencePrefix}${referenceSequence.trim()}`;
  const total = selectedItems.reduce((sum, line) => {
    const months = Number.parseInt(line.months, 10);
    const monthMultiplier = isRental && Number.isInteger(months) && months > 0 ? months : 1;
    return sum + (line.item?.listPrice ?? 0) * line.qty * monthMultiplier;
  }, 0);

  function addItem(item: QuotationInventory) {
    setLines((current) => [...current, { inventoryId: item.id, qty: 1, months: "-" }]);
    setError(null);
  }

  function updateQty(index: number, qty: number) {
    setLines((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, qty } : line));
  }

  function updateMonths(index: number, months: string) {
    setLines((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, months } : line));
  }

  function normalizeMonths(index: number) {
    setLines((current) => current.map((line, lineIndex) => lineIndex === index && !line.months.trim() ? { ...line, months: "-" } : line));
  }

  function removeLine(index: number) {
    setLines((current) => current.filter((_, lineIndex) => lineIndex !== index));
  }

  function changeTemplate(nextTemplate: QuotationGenerateDto["template"]) {
    if (getReferenceCompany(nextTemplate) !== getReferenceCompany(template)) {
      setReferenceSequence("");
      setManualReference("");
    }
    setTemplate(nextTemplate);
  }

  async function handlePreview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (lines.length === 0) {
      setError("Add at least one product to the quotation.");
      return;
    }
    if (!quotationReference.trim() || (referencePrefix !== null && !referenceSequence.trim())) {
      setError(referencePrefix === null ? "Enter the quotation reference." : "Enter the quotation sequence number.");
      return;
    }

    const payload: QuotationGenerateDto = {
      template,
      customerName: customerName.trim(),
      address: address.trim(),
      attention: attention.trim() || null,
      tel: tel.trim() || null,
      ref: quotationReference,
      date,
      salesPerson: salesPerson.trim(),
      items: lines.map((line) => ({ ...line, months: line.months.trim() || "-" })),
    };

    setPreviewing(true);
    try {
      const result = await previewQuotation(payload);
      setPreviewPayload(payload);
      setPreviewUrl(URL.createObjectURL(result.blob));
      setExportError(null);
      setExportMessage(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to preview the quotation.");
    } finally {
      setPreviewing(false);
    }
  }

  async function handleExport(format: "pdf" | "docx") {
    if (!previewPayload) return;
    setExportError(null);
    setExportMessage(null);
    setExporting(format);
    try {
      const result = await generateQuotation(
        previewPayload,
        format,
        exportDestination,
        user?.nameUse || user?.name || "Unknown user"
      );
      if (result.destination === "synology") {
        setExportMessage(`${result.fileName} saved to the Synology Quotation folder.`);
        return;
      }
      const url = URL.createObjectURL(result.blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = result.fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Unable to export the quotation.");
    } finally {
      setExporting(null);
    }
  }

  function closePreview() {
    setPreviewUrl(null);
    setPreviewPayload(null);
    setExportError(null);
    setExportMessage(null);
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Quotation generator</h1>
            <p className="mt-1 text-sm text-slate-500">Enter customer details, select products and preview the quotation before exporting.</p>
          </div>
          <Link href="/quotation/inventory" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-orange-300 hover:text-orange-700">
            <PackagePlus size={16} /> Manage inventory
          </Link>
        </header>

        <form onSubmit={handlePreview} className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.9fr)]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-700"><FileText size={19} /></div>
                <div>
                  <h2 className="font-semibold text-slate-900">Quotation details</h2>
                  <p className="text-sm text-slate-500">Choose a template and enter the quotation header.</p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700">Template
                  <select value={template} onChange={(e) => changeTemplate(e.target.value as QuotationGenerateDto["template"])} className={fieldClass}>
                    <optgroup label="ATP">
                      <option value="ATP_RENT">Rental</option>
                      <option value="ATP_PURCHASE">Purchase</option>
                    </optgroup>
                    <optgroup label="Arena">
                      <option value="ARENA_RENT">Rental</option>
                      <option value="ARENA_PURCHASE">Purchase</option>
                    </optgroup>
                    <optgroup label="SkyActive">
                      <option value="SKYACTIVE_RENT">Rental</option>
                      <option value="SKYACTIVE_PURCHASE">Purchase</option>
                    </optgroup>
                    <optgroup label="ASN">
                      <option value="ASN_RENT">Rental</option>
                      <option value="ASN_PURCHASE">Purchase</option>
                    </optgroup>
                    <optgroup label="AllTime">
                      <option value="ALLTIME_RENT">Rental</option>
                      <option value="ALLTIME_PURCHASE">Purchase</option>
                    </optgroup>
                    <optgroup label="ATPKL">
                      <option value="ATPKL_RENT">Rental</option>
                      <option value="ATPKL_PURCHASE">Purchase</option>
                    </optgroup>
                    <optgroup label="GC">
                      <option value="GC_RENT">Rental</option>
                      <option value="GC_PURCHASE">Purchase</option>
                    </optgroup>
                    <optgroup label="A.T. PLAN COPY CENTRE & STATIONERY">
                      <option value="ATPLAN_COPY_RENT">Rental</option>
                      <option value="ATPLAN_COPY_PURCHASE">Purchase</option>
                    </optgroup>
                    <optgroup label="ATPLAN.SDN.BHD">
                      <option value="ATPLAN_SDN_RENT">Rental</option>
                      <option value="ATPLAN_SDN_PURCHASE">Purchase</option>
                    </optgroup>
                  </select>
                </label>
                <label className="text-sm font-medium text-slate-700">Quotation reference
                  {referencePrefix !== null ? (
                    <div className="mt-1.5 flex min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white transition focus-within:border-orange-400 focus-within:ring-4 focus-within:ring-orange-100">
                      <span className="flex shrink-0 items-center bg-slate-50 px-3.5 text-sm font-semibold text-slate-600">{referencePrefix}</span>
                      <input required maxLength={3} inputMode="numeric" pattern="[0-9]{1,3}" value={referenceSequence} onChange={(e) => { if (/^\d{0,3}$/.test(e.target.value)) setReferenceSequence(e.target.value); }} placeholder="001" aria-label="Quotation sequence number" className="min-w-0 flex-1 px-3.5 py-2.5 text-sm text-slate-800 outline-none" />
                    </div>
                  ) : (
                    <input required maxLength={50} value={manualReference} onChange={(e) => setManualReference(e.target.value)} placeholder="Enter quotation reference" className={fieldClass} />
                  )}
                  <span className="mt-1 block text-xs font-normal text-slate-400">{referencePrefix === null ? "Enter the complete reference manually for this template." : "The date-based prefix is automatic; enter the 3-digit sequence."}</span>
                </label>
                <label className="text-sm font-medium text-slate-700">Customer name
                  <input required maxLength={200} value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Company or customer name" className={fieldClass} />
                </label>
                <label className="text-sm font-medium text-slate-700">Quotation date
                  <input required type="date" value={date} onChange={(e) => setDate(e.target.value)} className={fieldClass} />
                </label>
                <label className="text-sm font-medium text-slate-700 sm:col-span-2">Address
                  <textarea required rows={3} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter the customer's billing address" className={fieldClass} />
                </label>
                <label className="text-sm font-medium text-slate-700">Attention
                  <input value={attention} onChange={(e) => setAttention(e.target.value)} placeholder="Contact person (optional)" className={fieldClass} />
                </label>
                <label className="text-sm font-medium text-slate-700">Telephone
                  <input value={tel} onChange={(e) => setTel(e.target.value)} placeholder="Phone number (optional)" className={fieldClass} />
                </label>
                <label className="text-sm font-medium text-slate-700 sm:col-span-2">Salesperson
                  <select required value={salesPerson} onChange={(e) => setSalesPerson(e.target.value)} className={fieldClass}>
                    <option value="" disabled>Select a salesperson</option>
                    {[
                      "Keith",
                      "Michael",
                      "Husna",
                      "Hannah",
                      "Husni",
                      "Ikhwan",
                      "Lily",
                      "Aina",
                      "Khloe",
                      "Sonia",
                      "Syafiqah",
                      "Iqliah",
                      "Boon",
                      "Cheong",
                    ].map((name) => <option key={name} value={name}>{name}</option>)}
                  </select>
                </label>
              </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5 sm:p-6">
                <h2 className="font-semibold text-slate-900">Products and quantities</h2>
                <p className="mt-1 text-sm text-slate-500">Search inventory and add each product to the quotation.</p>
                <div className="relative mt-4">
                  <Search size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input value={productSearch} onChange={(e) => setProductSearch(e.target.value)} placeholder="Search product name, code or type" className={`${fieldClass} mt-0 pl-10`} />
                </div>
              </div>
              <div className="max-h-[440px] divide-y divide-slate-100 overflow-y-auto">
                {inventoryLoading && <div className="px-5 py-12 text-center text-sm text-slate-500">Loading inventory…</div>}
                {!inventoryLoading && inventoryError && <div role="alert" className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{inventoryError}</div>}
                {!inventoryLoading && !inventoryError && filteredInventory.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-3.5 transition hover:bg-slate-50">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{item.productName || item.productCode || "Unnamed product"}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">{[item.itemType, item.productCode].filter(Boolean).join(" · ") || "No product code"}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="text-sm font-medium tabular-nums text-slate-700">{money(item.listPrice)}</span>
                      <button type="button" onClick={() => addItem(item)} aria-label={`Add ${item.productName || item.productCode || "product"}`} className="flex h-9 w-9 items-center justify-center rounded-lg border border-orange-200 bg-orange-50 text-orange-700 transition hover:bg-orange-100"><PackagePlus size={17} /></button>
                    </div>
                  </div>
                ))}
                {!inventoryLoading && !inventoryError && filteredInventory.length === 0 && <div className="px-5 py-12 text-center text-sm text-slate-500">{inventory.length === 0 ? "No inventory items available." : "No matching products found."}</div>}
                {!inventoryLoading && !inventoryError && !productSearch && inventory.length > filteredInventory.length && <p className="border-t border-slate-100 px-5 py-3 text-center text-xs text-slate-400">Showing the first 80 products. Search to find more.</p>}
              </div>
            </section>
          </div>

          <aside className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:sticky xl:top-6">
            <div className="border-b border-slate-100 p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-slate-900">Selected products</h2>
                  <p className="mt-1 text-sm text-slate-500">{lines.length} {lines.length === 1 ? "line" : "lines"} in this quotation</p>
                </div>
                <span className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700">{template.endsWith("RENT") ? "Rental" : "Purchase"}</span>
              </div>
            </div>

            <div className="max-h-[520px] min-h-36 divide-y divide-slate-100 overflow-y-auto">
              {selectedItems.map((line, index) => (
                <div key={`${line.inventoryId}-${index}`} className="p-4 sm:px-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="whitespace-pre-line text-sm font-medium leading-5 text-slate-800">{line.item?.productName || line.item?.productCode || "Unnamed product"}</p>
                      {line.item?.productCode && <p className="mt-1 text-xs text-slate-500">{line.item.productCode}</p>}
                    </div>
                    <button type="button" onClick={() => removeLine(index)} aria-label="Remove item" className="rounded-lg p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"><Trash2 size={16} /></button>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-2 text-xs font-medium text-slate-500">{isAsn ? "Unit" : "Qty"}
                        <input type="number" min={1} max={1000000} value={line.qty} onChange={(e) => updateQty(index, Math.max(1, Number(e.target.value) || 1))} className="w-20 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-800 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
                      </label>
                      {isRental && <label className="flex items-center gap-2 text-xs font-medium text-slate-500">{isAsn ? "Month" : "Months"}
                        <input type="text" inputMode="numeric" maxLength={4} placeholder="-" value={line.months} onChange={(e) => { const value = e.target.value.trim(); if (value === "" || value === "-" || (/^\d{1,4}$/.test(value) && Number(value) <= 1200)) updateMonths(index, value); }} onBlur={() => normalizeMonths(index)} className="w-20 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-800 outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-100" />
                      </label>}
                    </div>
                    {(() => { const months = Number.parseInt(line.months, 10); const multiplier = isRental && Number.isInteger(months) && months > 0 ? months : 1; return <span className="text-sm font-semibold tabular-nums text-slate-800">{money(line.item?.listPrice == null ? null : line.item.listPrice * line.qty * multiplier)}</span>; })()}
                  </div>
                </div>
              ))}
              {selectedItems.length === 0 && <div className="flex min-h-36 flex-col items-center justify-center px-6 text-center"><PackagePlus size={22} className="text-slate-300" /><p className="mt-3 text-sm font-medium text-slate-600">Your quotation is empty</p><p className="mt-1 text-xs text-slate-400">Add products from the inventory list.</p></div>}
            </div>

            <div className="border-t border-slate-100 bg-slate-50/70 p-5 sm:p-6">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Estimated total</span>
                <span className="text-lg font-semibold tabular-nums text-slate-900">{money(total)}</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">Final totals are calculated in the generated document.</p>
              {error && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</p>}
              <button type="submit" disabled={previewing || inventoryLoading} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50">
                {previewing ? <><LoaderCircle size={17} className="animate-spin" /> Preparing preview…</> : <><Eye size={17} /> Preview quotation</>}
              </button>
            </div>
          </aside>
        </form>
      </div>
      {previewUrl && previewPayload && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 p-2 backdrop-blur-sm sm:p-5">
          <section role="dialog" aria-modal="true" aria-labelledby="quotation-preview-title" className="mx-auto flex h-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3 sm:px-6">
              <div className="min-w-0">
                <h2 id="quotation-preview-title" className="font-semibold text-slate-900">Quotation preview</h2>
                <p className="truncate text-xs text-slate-500">{previewPayload.ref} · {previewPayload.template.replaceAll("_", " ")}</p>
              </div>
              <button type="button" onClick={closePreview} aria-label="Close preview" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"><X size={19} /></button>
            </header>
            <div className="min-h-0 flex-1 bg-slate-100">
              <iframe src={previewUrl} title="Generated quotation PDF preview" className="h-full w-full border-0" />
            </div>
            <footer className="flex flex-col gap-3 border-t border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800">Looks good?</p>
                <label className="mt-2 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
                  <span>Save location</span>
                  <select value={exportDestination} onChange={(event) => setExportDestination(event.target.value as "download" | "synology")} disabled={!!exporting} className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100">
                    <option value="download">Download to this computer</option>
                    <option value="synology">Synology — /volume1/Marketing_Folder/Quotation</option>
                  </select>
                </label>
                <p className="mt-1 text-xs text-slate-500">Choose PDF for sharing or Word if you want to edit the document.</p>
                {exportError && <p role="alert" className="mt-1 text-xs text-red-600">{exportError}</p>}
                {exportMessage && <p role="status" className="mt-1 text-xs text-emerald-700">{exportMessage}</p>}
              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                <button type="button" onClick={closePreview} disabled={!!exporting} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">Back to edit</button>
                <button type="button" onClick={() => handleExport("docx")} disabled={!!exporting} className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">
                  {exporting === "docx" ? <LoaderCircle size={16} className="animate-spin" /> : <FileText size={16} />} {exportDestination === "synology" ? "Save Word" : "Export Word"}
                </button>
                <button type="button" onClick={() => handleExport("pdf")} disabled={!!exporting} className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:opacity-50">
                  {exporting === "pdf" ? <LoaderCircle size={16} className="animate-spin" /> : <ArrowDownToLine size={16} />} {exportDestination === "synology" ? "Save PDF" : "Export PDF"}
                </button>
              </div>
            </footer>
          </section>
        </div>
      )}
    </main>
  );
}
