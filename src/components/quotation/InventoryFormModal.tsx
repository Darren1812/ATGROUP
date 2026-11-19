"use client";

import { useState } from "react";
import { ApiError, QuotationInventory, SaveDto } from "@/lib/quotationInventoryApi";

const TYPE_SUGGESTIONS = ["DIS", "TRANSPORTATION", "REMARKS", "OTHER"];

type Props = {
  item: QuotationInventory | null;
  mode: "create" | "edit" | "duplicate";
  onClose: () => void;
  onSave: (dto: SaveDto) => Promise<void>;
};

export default function InventoryFormModal({ item, mode, onClose, onSave }: Props) {
  const [itemType, setItemType] = useState(item?.itemType ?? "");
  const [productCode, setProductCode] = useState(item?.productCode ?? "");
  const [productName, setProductName] = useState(item?.productName ?? "");
  const [listPrice, setListPrice] = useState(item?.listPrice?.toString() ?? "");
  const [additionalInfo, setAdditionalInfo] = useState(item?.additionalInfo ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    let price: number | null = null;
    if (listPrice.trim() !== "") {
      price = Number(listPrice);
      if (!Number.isFinite(price)) return setError("Enter a valid list price.");
    }

    setSaving(true);
    try {
      await onSave({
        itemType: itemType.trim() || null,
        productCode: productCode.trim() || null,
        productName: productName.trim(),
        listPrice: price,
        additionalInfo: additionalInfo.trim() || null,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to save this item.");
      setSaving(false);
    }
  }

  const input = "w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
      <form onSubmit={submit} className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
        <div className="border-b border-slate-100 px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange-700">Inventory</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">{mode === "edit" ? "Edit item" : mode === "duplicate" ? "Duplicate item" : "Add item"}</h2>
          <p className="mt-1 text-sm text-slate-500">{mode === "duplicate" ? "Review and change the copied details, then save as a new inventory item." : "Product name is optional. Leave it blank when it does not apply."}</p>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              <span className="mb-1.5 block">Type</span>
              <input className={input} list="inventory-type-suggestions" value={itemType} onChange={(e) => setItemType(e.target.value)} placeholder="Select or enter a type" />
              <datalist id="inventory-type-suggestions">{TYPE_SUGGESTIONS.map((type) => <option key={type} value={type} />)}</datalist>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              <span className="mb-1.5 block">Product code</span>
              <input className={input} value={productCode} onChange={(e) => setProductCode(e.target.value)} placeholder="Enter product code" />
            </label>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            <span className="mb-1.5 block">Product name <span className="font-normal text-slate-400">(optional)</span></span>
            <textarea className={input} rows={4} value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="Enter product name, or leave blank" />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            <span className="mb-1.5 block">List price <span className="font-normal text-slate-400">(use a negative value for discounts)</span></span>
            <input className={input} type="number" step="0.01" value={listPrice} onChange={(e) => setListPrice(e.target.value)} placeholder="0.00" />
          </label>

          <label className="block text-sm font-medium text-slate-700">
            <span className="mb-1.5 block">Additional information</span>
            <textarea className={input} rows={3} value={additionalInfo} onChange={(e) => setAdditionalInfo(e.target.value)} placeholder="Add notes or details" />
          </label>

          {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700">{error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/70 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">Cancel</button>
          <button type="submit" disabled={saving} className="rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Saving…" : mode === "edit" ? "Save changes" : "Save as new item"}</button>
        </div>
      </form>
    </div>
  );
}
