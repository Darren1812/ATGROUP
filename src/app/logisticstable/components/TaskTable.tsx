"use client";

import {
  DndContext,
  closestCenter,
} from "@dnd-kit/core";
import { SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import {
  Package,
  Loader2,
  CheckCircle2,
  Upload,
  Eye,
  ArrowRight,
  Trash2,
} from "lucide-react";
import { Highlight, SortableHeader } from "./shared";
import { computeDisplayStatus, formatForInput, formatDate, getTodayMinString, mapUrl, formatDisplayValue } from "../utils";
import { STATUS_CONFIG } from "../constants";
import type { Column, DocStatusEntry } from "../types";

interface LinkWrapperProps {
  children: React.ReactNode;
  className?: string;
  href?: string;
}

function LinkWrapper({ children, className, href = "#" }: LinkWrapperProps) {
  return (
    <a
      href={href}
      target='_blank'
      rel='noopener noreferrer'
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all duration-200 border ${className || ""}`}
    >
      {children}
    </a>
  );
}

interface TaskTableProps {
  loading: boolean;
  tasks: any[];
  filteredTasks: any[];
  clearAllFilters: () => void;
  visibleColumns: Column[];
  sensors: any;
  handleDragEnd: (event: any) => void;
  searchQuery: string;
  docStatus: Record<number, DocStatusEntry>;
  uploadingDoc: Record<string, boolean>;
  triggerUpload: (id: number, type: "installation" | "do" | "complete") => void;
  viewDocument: (id: number, type: "installation" | "do" | "complete") => void;
  updateEstimate: (id: any, value: string) => void;
  updateSchedule: (id: number, value: string) => void;
  updatePic: (id: number, value: string, scheduleAt?: string) => void;
  markStockArrived: (id: number) => void;
  deletingId: number | null;
  deleteTask: (id: number) => void;
}

const PIC_LIST_OPTIONS = ["Akmal", "Nahfiz", "Darwin", "Darren"];

export function TaskTable({
  loading,
  tasks,
  filteredTasks,
  clearAllFilters,
  visibleColumns,
  sensors,
  handleDragEnd,
  searchQuery,
  docStatus,
  uploadingDoc,
  triggerUpload,
  viewDocument,
  updateEstimate,
  updateSchedule,
  updatePic,
  markStockArrived,
  deletingId,
  deleteTask,
}: TaskTableProps) {
  const renderCellContent = (t: any, colKey: string) => {
    const isInstallUploaded = docStatus[t.id]?.install || t.hasInstallationForm;
    const isDoUploaded = docStatus[t.id]?.do || t.hasDo;
    const isCompleteUploaded = docStatus[t.id]?.complete || t.hasComplete;

    switch (colKey) {
      case "orderNumber":
        return (
          <span className='text-[11px] w-[100px] text-gray-400 leading-snug'>
            <Highlight text={t.orderNumber} query={searchQuery} />
          </span>
        );
      case "createdAt":
        return (
          <span className='text-[11px] w-[160px] text-gray-400 leading-snug'>
            <Highlight text={t.createdAt} query={searchQuery} />
          </span>
        );
      case "createdBy":
        return (
          <span className='text-gray-400 text-xs leading-snug text-[11px] px-2 py-1.5 w-[50px]'>
            <Highlight text={t.createdBy} query={searchQuery} />
          </span>
        );
      case "from":
        return (
          <LinkWrapper
            href={mapUrl(t.from)}
            className='inline-block w-[250px] whitespace-normal break-words bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200 text-[11px] px-2 py-1.5 rounded-lg'
          >
            <Highlight text={formatDisplayValue(t.from)} query={searchQuery} />
          </LinkWrapper>
        );
      case "companyName":
        return (
          <LinkWrapper
            href={mapUrl(t.companyName)}
            className='inline-block w-[180px] whitespace-normal break-words bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200 text-[11px] px-2 py-1.5 rounded-lg'
          >
            <Highlight text={formatDisplayValue(t.companyName)} query={searchQuery} />
          </LinkWrapper>
        );
      case "location":
        return (
          <LinkWrapper
            href={mapUrl(t.location)}
            className='inline-block w-[220px] whitespace-normal break-words bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 hover:border-emerald-200 text-[11px] px-2 py-1.5 rounded-lg'
          >
            <Highlight text={formatDisplayValue(t.location)} query={searchQuery} />
          </LinkWrapper>
        );
      case "phoneNumber":
        return (
          <span className='text-[11px] px-2 py-1.5 w-[160px] text-gray-400 text-xs leading-snug'>
            <Highlight text={t.phoneNumber} query={searchQuery} />
          </span>
        );
      case "item":
        return (
          <span className='inline-flex flex-col px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold border border-slate-200 leading-snug whitespace-pre-wrap text-[11px] px-2 py-1.5 w-[200px]'>
            {t.item?.split("\n").map((line: string, i: number) => (
              <span key={i}>
                <Highlight text={line} query={searchQuery} />
              </span>
            ))}
          </span>
        );
      case "estimate":
        return (
          <input
            type='datetime-local'
            min={getTodayMinString()}
            defaultValue={formatForInput(t.time)}
            onBlur={(e) => updateEstimate(t.id, e.target.value)}
            className='text-[11px] px-2 py-1.5 w-[160px] border border-slate-200 rounded-lg bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-700'
          />
        );
      case "schedule":
        return (
          <input
            type='datetime-local'
            min={getTodayMinString()}
            defaultValue={formatDate(t.scheduledAt)}
            onBlur={(e) => updateSchedule(t.id, e.target.value)}
            className='text-[11px] px-2 py-1.5 w-[165px] border border-slate-200 rounded-lg bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-700'
          />
        );
      case "pic":
        return (
          <div className='relative w-[120px]'>
            <input
              list={`pic-list-${t.id}`}
              defaultValue={t.picDeliver}
              onBlur={(e) => updatePic(t.id, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              className='text-[11px] px-2 py-1.5 w-full border border-slate-200 rounded-lg bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all text-slate-700'
              placeholder='Select PIC'
            />
            <datalist id={`pic-list-${t.id}`}>
              {PIC_LIST_OPTIONS.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </div>
        );
      case "status": {
        const displayStatus = computeDisplayStatus(t);
        const cfg = STATUS_CONFIG[displayStatus] ?? STATUS_CONFIG["Waiting"];
        return (
          <div className='flex flex-col gap-1.5 w-[130px]'>
            <div
              className={`text-[11px] px-2 py-1.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${cfg.bg} ${cfg.color}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
              {cfg.label}
            </div>
            {displayStatus === "AwaitingStock" && (
              <button
                onClick={() => markStockArrived(t.id)}
                className='flex items-center justify-center gap-1 px-2 py-1 text-[10px] font-bold text-orange-700 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg transition-colors'
              >
                <CheckCircle2 size={11} />
                Stock Arrived
              </button>
            )}
          </div>
        );
      }
      case "doId": {
        const doIdValue = t.doId ?? t.DoId;
        return (
          <span className='text-[11px] px-2 py-1.5 w-[110px] text-slate-600 font-semibold leading-snug inline-block'>
            {doIdValue ? (
              <Highlight text={doIdValue} query={searchQuery} />
            ) : (
              <span className='text-slate-300 italic'>—</span>
            )}
          </span>
        );
      }
      case "documents":
        return (
          <div className='flex flex-col gap-2'>
            <div className='flex items-center gap-1.5'>
              <button
                onClick={() => triggerUpload(t.id, "installation")}
                disabled={uploadingDoc[`${t.id}-installation`]}
                title='Upload Installation Form'
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold rounded-lg border transition-all disabled:opacity-50
                  ${isInstallUploaded ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100" : "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200"}`}
              >
                {uploadingDoc[`${t.id}-installation`] ? (
                  <Loader2 size={11} className='animate-spin' />
                ) : isInstallUploaded ? (
                  <CheckCircle2 size={11} />
                ) : (
                  <Upload size={11} />
                )}
                Install
              </button>
              <button
                onClick={() => viewDocument(t.id, "installation")}
                title='View'
                className='p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all'
              >
                <Eye size={13} />
              </button>
            </div>
            <div className='flex items-center gap-1.5'>
              <button
                onClick={() => triggerUpload(t.id, "do")}
                disabled={uploadingDoc[`${t.id}-do`]}
                title='Upload Delivery Order'
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold rounded-lg border transition-all disabled:opacity-50
                  ${isDoUploaded ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100" : "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200"}`}
              >
                {uploadingDoc[`${t.id}-do`] ? (
                  <Loader2 size={11} className='animate-spin' />
                ) : isDoUploaded ? (
                  <CheckCircle2 size={11} />
                ) : (
                  <Upload size={11} />
                )}
                DO
              </button>
              <button
                onClick={() => viewDocument(t.id, "do")}
                title='View'
                className='p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all'
              >
                <Eye size={13} />
              </button>
            </div>
            <div className='flex items-center gap-1.5'>
              <button
                onClick={() => triggerUpload(t.id, "complete")}
                disabled={uploadingDoc[`${t.id}-complete`]}
                title='Upload Completion Photo/Doc'
                className={`flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold rounded-lg border transition-all disabled:opacity-50
                  ${isCompleteUploaded ? "bg-red-50 border-red-200 text-red-700 hover:bg-red-100" : "bg-slate-100 border-slate-200 text-slate-500 hover:bg-slate-200"}`}
              >
                {uploadingDoc[`${t.id}-complete`] ? (
                  <Loader2 size={11} className='animate-spin' />
                ) : isCompleteUploaded ? (
                  <CheckCircle2 size={11} />
                ) : (
                  <Upload size={11} />
                )}
                Complete
              </button>
              <button
                onClick={() => viewDocument(t.id, "complete")}
                title='View Completion Proof'
                className='p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all'
              >
                <Eye size={13} />
              </button>
            </div>
          </div>
        );
      case "remark":
        return (
          <span className='inline-block w-[160px] whitespace-pre-wrap break-words text-[11px] text-slate-600 leading-snug'>
            {t.remark ? (
              <Highlight text={t.remark} query={searchQuery} />
            ) : (
              <span className='text-slate-300 italic'>—</span>
            )}
          </span>
        );
      case "action":
        return (
          <div className='flex items-center gap-2 opacity-100 transition-opacity duration-200'>
            <button
              onClick={() => (window.location.href = `/logistics/${t.id}`)}
              className='flex items-center gap-1 px-3 py-1.5 text-[11px] font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-lg transition-colors whitespace-nowrap'
            >
              Edit <ArrowRight size={11} />
            </button>
            <button
              onClick={() => deleteTask(t.id)}
              disabled={deletingId === t.id}
              className='p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all duration-200 disabled:opacity-50'
            >
              {deletingId === t.id ? (
                <Loader2 size={15} className='animate-spin' />
              ) : (
                <Trash2 size={15} />
              )}
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className='bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden'>
      <div className='px-6 py-4 border-b border-slate-100 flex items-center justify-between'>
        <h2 className='text-[11px] font-black tracking-[0.3em] text-slate-400 uppercase flex items-center gap-3'>
          All Deliveries <div className='h-px w-16 bg-slate-200' />
        </h2>
        <span className='text-xs font-bold text-slate-400'>
          {filteredTasks.length !== tasks.length ? (
            <>
              {filteredTasks.length} <span className='text-slate-300 font-normal'>of</span> {tasks.length} records
            </>
          ) : (
            <>
              {tasks.length} record{tasks.length !== 1 ? "s" : ""}
            </>
          )}
        </span>
      </div>

      {loading ? (
        <div className='py-24 flex flex-col items-center gap-4'>
          <Loader2 size={32} className='text-indigo-400 animate-spin' />
          <p className='text-slate-400 text-sm font-medium'>Loading tasks...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className='py-24 text-center'>
          <div className='inline-flex p-6 rounded-full bg-slate-100 mb-4'>
            <Package size={36} className='text-slate-300' />
          </div>
          {tasks.length === 0 ? (
            <>
              <p className='text-slate-600 font-bold'>No logistics tasks yet</p>
              <p className='text-slate-400 text-sm mt-1'>Click "New Task" to get started</p>
            </>
          ) : (
            <>
              <p className='text-slate-600 font-bold'>No results match your filters</p>
              <button
                onClick={clearAllFilters}
                className='mt-3 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors'
              >
                Clear all filters
              </button>
            </>
          )}
        </div>
      ) : (
        <div className='overflow-x-auto'>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <table className='w-full text-sm border-collapse' style={{ minWidth: "1400px" }}>
              <colgroup>
                {visibleColumns.map((col) => (
                  <col key={col.key} style={{ width: `${col.width}px` }} />
                ))}
              </colgroup>
              <thead>
                <tr>
                  <SortableContext
                    items={visibleColumns.map((c) => c.key)}
                    strategy={horizontalListSortingStrategy}
                  >
                    {visibleColumns.map((col) => (
                      <SortableHeader key={col.key} col={col} />
                    ))}
                  </SortableContext>
                </tr>
              </thead>
              <tbody className='divide-y divide-slate-100'>
                {filteredTasks.map((t) => (
                  <tr key={t.id} className='hover:bg-slate-50/70 transition-colors duration-150 group'>
                    {visibleColumns.map((col) => (
                      <td key={col.key} className='px-5 py-4'>
                        {renderCellContent(t, col.key)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </DndContext>
        </div>
      )}
    </div>
  );
}