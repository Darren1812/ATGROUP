"use client";

import { X, Plus, Loader2, CheckCircle2 } from "lucide-react";

interface CreateTaskFormProps {
  show: boolean;
  newTasks: any[];
  submitting: boolean;
  name: string;
  onClose: () => void;
  onAddRow: () => void;
  onUpdateRow: (i: number, field: string, value: string) => void;
  onSubmit: () => void;
}

export function CreateTaskForm({
  show,
  newTasks,
  submitting,
  name,
  onClose,
  onAddRow,
  onUpdateRow,
  onSubmit,
}: CreateTaskFormProps) {
  if (!show) return null;

  return (
    <div className='bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden'>
      <div className='px-6 py-4 border-b border-slate-100 flex items-center justify-between'>
        <div>
          <h2 className='text-sm font-black text-slate-800 uppercase tracking-wider'>
            Create New Tasks
          </h2>
          <p className='text-xs text-slate-400 mt-0.5'>
            Fill in the details below. You can add multiple rows.
          </p>
        </div>
        <button
          onClick={onClose}
          className='p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors'
        >
          <X size={16} />
        </button>
      </div>
      <div className='p-6 space-y-3'>
        <div className='hidden md:grid grid-cols-9 gap-3 px-1'>
          {[
            "From",
            "Company",
            "Location",
            "Item",
            "Estimate Time",
            "Phone Number",
            "Status",
            "Created By",
          ].map((h) => (
            <p
              key={h}
              className='text-[10px] font-black text-slate-400 uppercase tracking-wider'
            >
              {h}
            </p>
          ))}
        </div>
        {newTasks.map((task, i) => (
          <div
            key={i}
            className='grid grid-cols-1 md:grid-cols-9 gap-3 items-center group'
          >
            {(["from", "companyName", "location", "item"] as const).map(
              (field) =>
                field === "item" ? (
                  <textarea
                    key={field}
                    placeholder='Item'
                    value={task[field]}
                    onChange={(e) => onUpdateRow(i, field, e.target.value)}
                    rows={2}
                    className='w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-800 placeholder:text-slate-400 resize-none'
                  />
                ) : (
                  <input
                    key={field}
                    placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                    value={task[field]}
                    onChange={(e) => onUpdateRow(i, field, e.target.value)}
                    className='w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-800 placeholder:text-slate-400'
                  />
                ),
            )}
            <input
              type='datetime-local'
              value={task.scheduledTime}
              onChange={(e) => onUpdateRow(i, "scheduledTime", e.target.value)}
              className='w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-800'
            />
            <input
              placeholder='Phone Number'
              value={task.phoneNumber}
              onChange={(e) => onUpdateRow(i, "phoneNumber", e.target.value)}
              className='w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none'
            />
            <select
              value={task.status || "AwaitingStock"}
              onChange={(e) => onUpdateRow(i, "status", e.target.value)}
              className='w-full px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-800'
            >
              <option value='AwaitingStock'>Awaiting Stock</option>
              <option value='Waiting'>Waiting (Stock Ready)</option>
            </select>
            <input
              type='text'
              value={name}
              readOnly
              className='border p-2 rounded bg-slate-100 cursor-not-allowed text-slate-500'
              placeholder='Enter name'
            />
          </div>
        ))}
      </div>
      <div className='px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between'>
        <button
          onClick={onAddRow}
          className='flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors'
        >
          <Plus size={15} /> Add another row
        </button>
        <div className='flex items-center gap-3'>
          <button
            onClick={onClose}
            className='px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors'
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting}
            className='flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-xl transition-all duration-200 disabled:opacity-60 shadow-md shadow-indigo-200'
          >
            {submitting ? (
              <Loader2 size={15} className='animate-spin' />
            ) : (
              <CheckCircle2 size={15} />
            )}
            {submitting ? "Saving..." : "Submit Tasks"}
          </button>
        </div>
      </div>
    </div>
  );
}
