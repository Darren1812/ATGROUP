"use client";

import { FileText, X, ArrowRight, Package, Plus, Trash2 } from "lucide-react";
import type { PendingTaskDraft } from "../types";

interface OcrDraftPanelProps {
  pendingTasks: PendingTaskDraft[];
  onClearDrafts: () => void;
  onConfirmSubmitAll: () => void;
  onRemoveTask: (taskIdx: number) => void;
  onUpdateField: <K extends keyof PendingTaskDraft>(
    taskIdx: number,
    field: K,
    value: PendingTaskDraft[K],
  ) => void;
  onUpdateItem: (taskIdx: number, itemIdx: number, value: string) => void;
  onUpdateItemStatus: (
    taskIdx: number,
    itemIdx: number,
    value: string,
  ) => void;
  onRemoveItem: (taskIdx: number, itemIdx: number) => void;
  onAddItem: (taskIdx: number) => void;
}

export function OcrDraftPanel({
  pendingTasks,
  onClearDrafts,
  onConfirmSubmitAll,
  onRemoveTask,
  onUpdateField,
  onUpdateItem,
  onUpdateItemStatus,
  onRemoveItem,
  onAddItem,
}: OcrDraftPanelProps) {
  if (pendingTasks.length === 0) return null;

  return (
    <div className='mb-6 p-4 border border-violet-200 bg-violet-50/40 rounded-xl'>
      <div className='flex items-center justify-between mb-4'>
        <div className='flex items-center gap-2'>
          <div className='p-1.5 bg-violet-100 text-violet-700 rounded-md'>
            <FileText size={16} />
          </div>
          <div>
            <h3 className='font-bold text-sm text-slate-800'>
              AI Parsed Drafts — Pending Confirmation
            </h3>
            <p className='text-[11px] text-slate-500'>
              Review details below, then save to the system. Multiple items
              will be auto-split into separate tasks sharing the same order
              number.
            </p>
          </div>
        </div>
        <div className='flex gap-2'>
          <button
            onClick={onClearDrafts}
            className='px-3 py-1.5 text-xs font-semibold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors'
          >
            Clear Drafts
          </button>
          <button
            onClick={onConfirmSubmitAll}
            className='flex items-center gap-1.5 px-4 py-1.5 text-xs font-black text-white bg-violet-600 rounded-lg hover:bg-violet-700 transition-all shadow-sm'
          >
            Confirm & Save to System <ArrowRight size={13} />
          </button>
        </div>
      </div>

      <div className='grid grid-cols-1 gap-4'>
        {pendingTasks.map((draft, taskIndex) => (
          <div
            key={taskIndex}
            className='bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative'
          >
            <button
              onClick={() => onRemoveTask(taskIndex)}
              className='absolute top-3 right-3 text-slate-400 hover:text-slate-600'
            >
              <X size={14} />
            </button>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mb-3'>
              <div>
                <label className='block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1'>
                  From (Sender)
                </label>
                <input
                  type='text'
                  value={draft.from}
                  onChange={(e) =>
                    onUpdateField(taskIndex, "from", e.target.value)
                  }
                  className='w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-[11px] font-medium focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none'
                />
              </div>
              <div>
                <label className='block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1'>
                  Company (Recipient)
                </label>
                <input
                  type='text'
                  value={draft.companyName}
                  onChange={(e) =>
                    onUpdateField(taskIndex, "companyName", e.target.value)
                  }
                  className='w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-[11px] font-medium focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none'
                />
              </div>
              <div>
                <label className='block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1'>
                  Phone
                </label>
                <input
                  type='text'
                  value={draft.phoneNumber}
                  onChange={(e) =>
                    onUpdateField(taskIndex, "phoneNumber", e.target.value)
                  }
                  className='w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-[11px] font-medium focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none'
                />
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-xs mb-3 items-end'>
              <div className='md:col-span-2'>
                <label className='block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1'>
                  Location (Delivery Address)
                </label>
                <textarea
                  rows={2}
                  value={draft.location}
                  onChange={(e) =>
                    onUpdateField(taskIndex, "location", e.target.value)
                  }
                  className='w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-[11px] font-medium leading-relaxed focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none resize-none'
                />
              </div>
              <div>
                <label className='block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 text-violet-600'>
                  Estimate Delivery Time (Shared)
                </label>
                <input
                  type='datetime-local'
                  value={
                    draft.scheduledTime ? draft.scheduledTime.substring(0, 16) : ""
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    onUpdateField(
                      taskIndex,
                      "scheduledTime",
                      val ? `${val}:00` : null,
                    );
                  }}
                  className='w-full px-2.5 py-1.5 border border-violet-200 bg-violet-50/20 rounded-lg text-[11px] font-semibold text-slate-700 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 outline-none'
                />
              </div>
            </div>

            <div className='border-t border-slate-100 pt-3'>
              <span className='inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-violet-50 border border-violet-100 text-violet-700 text-[10px] font-black uppercase tracking-wider mb-2'>
                <Package size={11} />
                Items — this document will auto-split into {draft.items.length}{" "}
                task{draft.items.length !== 1 ? "s" : ""} sharing the same
                order number
              </span>
              <div className='space-y-1.5'>
                {draft.items.map((item, itemIdx) => (
                  <div key={itemIdx} className='flex items-center gap-2 pl-2'>
                    <span className='text-[10px] font-bold text-slate-400 w-4'>
                      #{itemIdx + 1}
                    </span>
                    <input
                      type='text'
                      value={item.description}
                      onChange={(e) =>
                        onUpdateItem(taskIndex, itemIdx, e.target.value)
                      }
                      className='flex-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-[11px] font-medium text-slate-700 focus:border-violet-400 focus:ring-1 focus:ring-violet-100 outline-none'
                    />
                    <select
                      value={item.status || "AwaitingStock"}
                      onChange={(e) =>
                        onUpdateItemStatus(taskIndex, itemIdx, e.target.value)
                      }
                      className={`px-2 py-1 rounded-md text-[10px] font-bold border outline-none cursor-pointer transition-colors
                        ${
                          item.status === "AwaitingStock"
                            ? "bg-orange-50 border-orange-200 text-orange-700"
                            : "bg-amber-50 border-amber-200 text-amber-700"
                        }`}
                    >
                      <option value='AwaitingStock'>Awaiting Stock</option>
                      <option value='Waiting'>Waiting</option>
                    </select>
                    <button
                      onClick={() => onRemoveItem(taskIndex, itemIdx)}
                      className='p-1 text-slate-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors'
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => onAddItem(taskIndex)}
                  className='flex items-center gap-1 pl-2 text-[11px] text-violet-600 font-bold hover:text-violet-800 transition-colors'
                >
                  <Plus size={12} /> Add item row
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
