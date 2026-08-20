"use client";

import { Columns3, CheckCircle2 } from "lucide-react";
import type { Column } from "../types";

interface ColumnMenuProps {
  columns: Column[];
  visibleCount: number;
  showColumnMenu: boolean;
  setShowColumnMenu: (v: boolean | ((prev: boolean) => boolean)) => void;
  toggleColumn: (key: string) => void;
  resetColumns: () => void;
}

export function ColumnMenu({
  columns,
  visibleCount,
  showColumnMenu,
  setShowColumnMenu,
  toggleColumn,
  resetColumns,
}: ColumnMenuProps) {
  return (
    <div className='flex justify-between items-center'>
      <div></div>
      <div className='relative'>
        <button
          onClick={() => setShowColumnMenu((v) => !v)}
          className='flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-xl border transition-all duration-200 whitespace-nowrap bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
        >
          <Columns3 size={15} />
          Columns
        </button>

        {showColumnMenu && (
          <>
            <div
              className='fixed inset-0 z-40'
              onClick={() => setShowColumnMenu(false)}
            />
            <div className='absolute top-full right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden'>
              <div className='px-4 py-3 border-b border-slate-100 flex items-center justify-between'>
                <span className='text-xs font-black text-slate-600 uppercase tracking-wider'>
                  Show Columns
                </span>
                <button
                  onClick={resetColumns}
                  className='text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors'
                >
                  Reset
                </button>
              </div>
              <div className='p-2 max-h-80 overflow-y-auto'>
                {columns.map((col) => {
                  const Icon = col.icon;
                  return (
                    <button
                      key={col.key}
                      onClick={() => toggleColumn(col.key)}
                      className='w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors text-left'
                    >
                      <div
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                          col.visible
                            ? "bg-indigo-600 border-indigo-600"
                            : "bg-white border-slate-300"
                        }`}
                      >
                        {col.visible && (
                          <CheckCircle2 size={12} className='text-white' />
                        )}
                      </div>
                      {Icon && <Icon size={14} className='text-slate-400' />}
                      <span className='text-sm font-medium text-slate-700'>
                        {col.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className='px-4 py-2.5 border-t border-slate-100 text-xs text-slate-500'>
                {visibleCount} of {columns.length} visible
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
