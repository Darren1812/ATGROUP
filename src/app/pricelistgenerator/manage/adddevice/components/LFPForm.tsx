"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LFPFormProps {
  /** Pass in `id` (from search params) when editing an existing record */
  editId?: number | null;
}

interface FormValues {
  productType: string;
  productName: string;
  productCode: string;
  netPrice: number;
  marketPrice: number;
  warranty: string;
  remark: string;
}

const EMPTY: FormValues = {
  productType: "",
  productName: "",
  productCode: "",
  netPrice: 0,
  marketPrice: 0,
  warranty: "",
  remark: "",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  n > 0 ? n.toLocaleString("en-MY", { minimumFractionDigits: 2 }) : null;

// ─── Component ────────────────────────────────────────────────────────────────

export default function LFPForm({ editId }: LFPFormProps) {
  const router = useRouter();
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  const isEditMode = !!editId;

  const [values, setValues] = useState<FormValues>(EMPTY);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ── Edit mode: prefill ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isEditMode || !editId) return;
    setLoading(true);
    fetch(`${baseUrl}/api/PlotterHardware/${editId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Record not found");
        return res.json();
      })
      .then((data) => {
        setValues({
          productType: data.productType || "",
          productName: data.productName || "",
          productCode: data.productCode || "",
          netPrice: data.netPrice || 0,
          marketPrice: data.marketPrice || 0,
          warranty: data.warranty || "",
          remark: data.remark || "",
        });
      })
      .catch((err) => alert(`Error loading record: ${err.message}`))
      .finally(() => setLoading(false));
  }, [isEditMode, editId, baseUrl]);

  // ── Field helpers ────────────────────────────────────────────────────────
  const set =
    (field: keyof FormValues) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) => {
      const val =
        e.target.type === "number"
          ? parseFloat(e.target.value) || 0
          : e.target.value;
      setValues((prev) => ({ ...prev, [field]: val }));
    };

  // ── Submit ───────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!values.productName.trim()) return alert("Product Name is required");
    if (!values.productCode.trim()) return alert("Product Code is required");

    const payload = {
      ...(isEditMode ? { id: editId } : {}),
      productType: values.productType,
      productName: values.productName,
      productCode: values.productCode,
      netPrice: Number(values.netPrice),
      marketPrice: Number(values.marketPrice),
      warranty: values.warranty,
      remark: values.remark,
    };

    const url = isEditMode
      ? `${baseUrl}/api/PlotterHardware/${editId}`
      : `${baseUrl}/api/PlotterHardware`;
    const method = isEditMode ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        router.push("/pricelistgenerator");
      } else {
        alert(`Failed: ${await res.text()}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!editId) return;
    try {
      const res = await fetch(`${baseUrl}/api/PlotterHardware/${editId}`, {
        method: "DELETE",
      });
      if (res.ok) router.push("/pricelistgenerator");
      else alert("Failed to delete.");
    } catch (err) {
      console.error(err);
    }
  };

  // ── Loading skeleton ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className='px-8 py-10 max-w-5xl mx-auto space-y-4 animate-pulse'>
        {[1, 2].map((i) => (
          <div
            key={i}
            className='bg-white rounded-xl border border-slate-200 h-48'
          />
        ))}
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <>
      <form onSubmit={handleSubmit}>
        <div className='px-8 py-5 max-w-5xl mx-auto space-y-4'>
          {/* ── Step 1: Product Identity ─────────────────────── */}
          <div className='bg-white rounded-xl border border-slate-200 overflow-hidden'>
            <div className='px-6 py-4 border-b border-slate-100 flex items-center gap-3'>
              <div className='w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0'>
                <span className='text-[11px] font-bold text-white'>1</span>
              </div>
              <div>
                <p className='text-sm font-bold text-slate-800'>
                  Product Identity
                </p>
                <p className='text-[11px] text-slate-400'>
                  Name, code, type and warranty details
                </p>
              </div>
            </div>

            <div className='px-6 py-5 space-y-4'>
              {/* Product Name */}
              <div>
                <label className='block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5'>
                  Product Name <span className='text-red-400'>*</span>
                </label>
                <input
                  type='text'
                  required
                  placeholder='e.g., Canon TM-355'
                  value={values.productName}
                  onChange={set("productName")}
                  className='w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition'
                />
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {/* Product Code */}
                <div>
                  <label className='block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5'>
                    Product Code <span className='text-red-400'>*</span>
                  </label>
                  <input
                    type='text'
                    required
                    placeholder='e.g., TM355-001'
                    value={values.productCode}
                    onChange={set("productCode")}
                    className='w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition'
                  />
                </div>

                {/* Product Type */}
                {/* Product Type */}
                <div>
                  <label className='block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5'>
                    Product Type
                  </label>

                  <input
                    list='product-types'
                    value={values.productType}
                    onChange={set("productType")}
                    placeholder='Select or type product type'
                    className='w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition'
                  />

                  <datalist id='product-types'>
                    <option value='TC SERIES' />
                    <option value='TM SERIES' />
                    <option value='TM-5350LM' />
                    <option value='TX SERIES' />
                    <option value='TZ SERIES' />
                    <option value='Lm24 SCANNER' />
                    <option value='Lm36 SCANNER' />
                    <option value='SCANNER (TM)' />
                    <option value='SCANNER (TX)' />
                    <option value='SCANNER (TZ)' />
                    <option value='PRO SERIES' />
                    <option value='GP SERIES' />
                    <option value='Accessories TZ' />
                    <option value='Software' />
                    <option value='Accessories' />
                  </datalist>
                </div>
              </div>

              {/* Warranty */}
              <div>
                <label className='block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5'>
                  Warranty
                </label>
                <input
                  type='text'
                  placeholder='e.g., 1 Year On-Site'
                  value={values.warranty}
                  onChange={set("warranty")}
                  className='w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition'
                />
              </div>
            </div>
          </div>

          {/* ── Step 2: Pricing ──────────────────────────────── */}
          <div className='bg-white rounded-xl border border-slate-200 overflow-hidden'>
            <div className='px-6 py-4 border-b border-slate-100 flex items-center gap-3'>
              <div className='w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0'>
                <span className='text-[11px] font-bold text-white'>2</span>
              </div>
              <div>
                <p className='text-sm font-bold text-slate-800'>Pricing</p>
                <p className='text-[11px] text-slate-400'>
                  Net (dealer) price and market (customer) price
                </p>
              </div>
            </div>

            <div className='px-6 py-5 space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                {/* Net Price */}
                <div>
                  <label className='block text-xs font-semibold text-blue-500 uppercase tracking-wide mb-1.5'>
                    Net Price (RM)
                  </label>
                  <input
                    type='number'
                    step='0.01'
                    min='0'
                    value={values.netPrice}
                    onChange={set("netPrice")}
                    className='w-full px-3.5 py-2.5 border border-blue-200 rounded-xl text-sm text-blue-700 font-semibold bg-blue-50/40 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition'
                  />
                </div>

                {/* Market Price */}
                <div>
                  <label className='block text-xs font-semibold text-emerald-500 uppercase tracking-wide mb-1.5'>
                    Market Price (RM)
                  </label>
                  <input
                    type='number'
                    step='0.01'
                    min='0'
                    value={values.marketPrice}
                    onChange={set("marketPrice")}
                    className='w-full px-3.5 py-2.5 border border-emerald-200 rounded-xl text-sm text-emerald-700 font-semibold bg-emerald-50/40 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition'
                  />
                </div>
              </div>

              {/* Price preview */}
              {(values.netPrice > 0 || values.marketPrice > 0) && (
                <div className='flex items-center gap-4 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3'>
                  <span className='text-[10px] font-bold text-slate-400 uppercase tracking-widest flex-shrink-0'>
                    Preview
                  </span>
                  <div className='flex items-center gap-6 flex-wrap'>
                    {values.netPrice > 0 && (
                      <div className='flex items-center gap-1.5'>
                        <span className='w-1.5 h-1.5 rounded-full bg-blue-500' />
                        <span className='text-xs font-semibold text-blue-600 tabular-nums'>
                          RM {fmt(values.netPrice)}
                        </span>
                        <span className='text-[10px] text-slate-400'>net</span>
                      </div>
                    )}
                    {values.marketPrice > 0 && (
                      <div className='flex items-center gap-1.5'>
                        <span className='w-1.5 h-1.5 rounded-full bg-emerald-400' />
                        <span className='text-xs font-semibold text-emerald-600 tabular-nums'>
                          RM {fmt(values.marketPrice)}
                        </span>
                        <span className='text-[10px] text-slate-400'>
                          market
                        </span>
                      </div>
                    )}
                    {values.netPrice > 0 && values.marketPrice > 0 && (
                      <div className='flex items-center gap-1.5 ml-auto'>
                        <span className='text-[10px] text-slate-400'>
                          Margin
                        </span>
                        <span
                          className={`text-xs font-bold tabular-nums ${values.marketPrice >= values.netPrice ? "text-emerald-600" : "text-red-500"}`}
                        >
                          {values.marketPrice >= values.netPrice ? "+" : ""}
                          RM{" "}
                          {fmt(Math.abs(values.marketPrice - values.netPrice))}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Step 3: Remarks ──────────────────────────────── */}
          <div className='bg-white rounded-xl border border-slate-200 overflow-hidden'>
            <div className='px-6 py-4 border-b border-slate-100 flex items-center gap-3'>
              <div className='w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0'>
                <span className='text-[11px] font-bold text-white'>3</span>
              </div>
              <div>
                <p className='text-sm font-bold text-slate-800'>Remarks</p>
                <p className='text-[11px] text-slate-400'>
                  Optional notes about this product
                </p>
              </div>
            </div>
            <div className='px-6 py-5'>
              <textarea
                rows={4}
                placeholder='Any extra notes, bundle inclusions, special conditions…'
                value={values.remark}
                onChange={set("remark")}
                className='w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-300 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition resize-none'
              />
            </div>
          </div>

          {/* ── Submit bar ───────────────────────────────────── */}
          <div className='bg-white rounded-xl border border-slate-200 px-6 py-4 flex items-center justify-between'>
            <div className='flex items-center gap-4 text-xs text-slate-400'>
              <span className='flex items-center gap-1.5'>
                <span className='w-1.5 h-1.5 rounded-full bg-emerald-400' />
                Large Format Printer
              </span>
              {values.productCode && (
                <>
                  <span className='w-px h-3 bg-slate-200' />
                  <span className='font-mono'>{values.productCode}</span>
                </>
              )}
            </div>
            <div className='flex items-center gap-2'>
              {isEditMode && (
                <button
                  type='button'
                  onClick={() => setShowDeleteConfirm(true)}
                  className='flex items-center gap-1.5 text-sm font-semibold text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl transition-colors'
                >
                  <svg
                    className='w-3.5 h-3.5'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a1 1 0 01-1-1V5a1 1 0 011-1h6a1 1 0 011 1v1a1 1 0 01-1 1H9z'
                    />
                  </svg>
                  Delete
                </button>
              )}
              <button
                type='button'
                onClick={() => router.back()}
                className='px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors'
              >
                Cancel
              </button>
              <button
                type='submit'
                className={`flex items-center gap-2 px-6 py-2 text-sm font-bold text-white rounded-xl shadow-sm transition-colors ${
                  isEditMode
                    ? "bg-amber-500 hover:bg-amber-400"
                    : "bg-emerald-600 hover:bg-emerald-500"
                }`}
              >
                <svg
                  className='w-4 h-4'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                  strokeWidth={2.5}
                >
                  {isEditMode ? (
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12'
                    />
                  ) : (
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      d='M5 13l4 4L19 7'
                    />
                  )}
                </svg>
                {isEditMode ? "Update Product" : "Save Product"}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* ── Delete Confirm Modal ─────────────────────────────── */}
      {showDeleteConfirm && (
        <div className='fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-2xl shadow-2xl w-full max-w-sm border border-slate-100 overflow-hidden'>
            <div className='px-6 py-5 flex flex-col items-center text-center gap-3'>
              <div className='w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center'>
                <svg
                  className='w-6 h-6 text-red-500'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                  strokeWidth={1.8}
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    d='M12 9v3m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z'
                  />
                </svg>
              </div>
              <div>
                <h3 className='text-sm font-bold text-slate-800'>
                  Delete "{values.productName}"?
                </h3>
                <p className='text-xs text-slate-500 mt-1 leading-relaxed'>
                  This will permanently remove this LFP product record. This
                  cannot be undone.
                </p>
              </div>
            </div>
            <div className='px-6 pb-5 flex gap-2'>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className='flex-1 px-4 py-2 text-sm font-medium text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors'
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className='flex-1 px-4 py-2 text-sm font-semibold bg-red-500 hover:bg-red-400 text-white rounded-xl shadow-sm transition-colors'
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
