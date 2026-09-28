"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
  disabled?: boolean;
  onPageChange: (page: number) => void;
}

export function Pagination({
  page,
  pageSize,
  totalCount,
  totalPages,
  hasNext,
  hasPrevious,
  disabled,
  onPageChange,
}: PaginationProps) {
  if (totalCount === 0) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, totalCount);

  const btn =
    "inline-flex items-center gap-1 px-3.5 py-2 text-sm font-bold rounded-xl border transition-all " +
    "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300 " +
    "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-white";

  return (
    <div className='px-6 py-4 border-t border-slate-100 flex items-center justify-between'>
      <span className='text-xs font-bold text-slate-400'>
        Showing {from}–{to}{" "}
        <span className='text-slate-300 font-normal'>of</span> {totalCount}{" "}
        records
      </span>

      <div className='flex items-center gap-3'>
        <button
          className={btn}
          disabled={!hasPrevious || disabled}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft size={15} /> Prev
        </button>

        <span className='text-sm font-bold text-slate-500 tabular-nums'>
          Page {page} <span className='text-slate-300 font-normal'>/</span>{" "}
          {totalPages}
        </span>

        <button
          className={btn}
          disabled={!hasNext || disabled}
          onClick={() => onPageChange(page + 1)}
        >
          Next <ChevronRight size={15} />
        </button>
      </div>
    </div>
  );
}