"use client";

import { X, GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export function Highlight({ text, query }: { text: string; query: string }) {
  if (!query || !text) return <>{text}</>;
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={i}
            className='bg-amber-200 text-amber-900 rounded px-0.5 not-italic'
          >
            {part}
          </mark>
        ) : (
          part
        ),
      )}
    </>
  );
}

export function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className='inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold rounded-full'>
      {label}
      <button
        onClick={onRemove}
        className='hover:text-indigo-900 transition-colors'
      >
        <X size={11} />
      </button>
    </span>
  );
}

export function SortableHeader({ col }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: col.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const Icon = col.icon;

  return (
    <th
      ref={setNodeRef}
      style={{ ...style, width: `${col.width}px` }}
      className='px-5 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap bg-slate-50 border-b border-slate-200'
    >
      <div className='flex items-center gap-1.5'>
        <button
          {...attributes}
          {...listeners}
          className='cursor-grab active:cursor-grabbing p-0.5 hover:bg-slate-200 rounded transition-colors'
          title='Drag to reorder'
        >
          <GripVertical size={14} className='text-slate-400' />
        </button>
        {Icon && <Icon size={11} />}
        {col.label}
      </div>
    </th>
  );
}
