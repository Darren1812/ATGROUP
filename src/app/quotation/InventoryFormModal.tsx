"use client";

import { useState } from "react";
import { ApiError, QuotationInventory, SaveDto } from "../../lib/quotationInventoryApi";


type Props = {
  item: QuotationInventory | null;
  typeOptions: string[];          // 新增
  onClose: () => void;
  onSave: (dto: SaveDto) => Promise<void>;
};

export default function InventoryFormModal({ item, typeOptions, onClose, onSave }: Props) {

  const [itemType, setItemType] = useState(item?.itemType ?? "");
  const [productCode, setProductCode] = useState(item?.productCode ?? "");
  const [productName, setProductName] = useState(item?.productName ?? "");
  const [listPrice, setListPrice] = useState(item?.listPrice?.toString() ?? "");
  const [additionalInfo, setAdditionalInfo] = useState(item?.additionalInfo ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!itemType.trim()) return setError("Type is required");
    if (!productName.trim()) return setError("Product name is required");

    let price: number | null = null;
    if (listPrice.trim() !== "") {
      price = Number(listPrice);
      if (Number.isNaN(price)) return setError("List Price is not a valid number");
    }

    setSaving(true);
    try {
      await onSave({
        itemType: itemType.trim(),
        productCode: productCode.trim() || null,
        productName: productName.trim(),
        listPrice: price,
        additionalInfo: additionalInfo.trim() || null,
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save");
      setSaving(false);
    }
  }

  const input = "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-500 focus:outline-none";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={submit}
        className="max-h-[90vh] w-full max-w-xl space-y-4 overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
      >
        <h2 className="text-lg font-bold">{item ? "Edit Inventory" : "Add Inventory"}</h2>

        <div className="grid grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium">Type *</span>
            <input
              className={input}
              list="type-suggestions"
              value={itemType}
              onChange={(e) => setItemType(e.target.value)}
            />
            <datalist id="type-suggestions">
              {typeOptions.map((t) => <option key={t} value={t} />)}
            </datalist>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block font-medium">Product Code</span>
            <input className={input} value={productCode} onChange={(e) => setProductCode(e.target.value)} />
          </label>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block font-medium">Product name *</span>
          <textarea
            className={input}
            rows={4}
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium">List Price(Enter negative values for discounts)</span>
          <input
            className={input}
            type="number"
            step="0.01"
            value={listPrice}
            onChange={(e) => setListPrice(e.target.value)}
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block font-medium">Additional inform</span>
          <textarea
            className={input}
            rows={3}
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value)}
          />
        </label>

        {error && <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}