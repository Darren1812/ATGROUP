"use client";

import { useState, useEffect, useCallback, ReactNode } from "react";
import { Trash2, Plus, X, BookOpen, LayoutGrid, CalendarClock, FileText } from "lucide-react";
import { CompanyViewProps, PrinterModel, ModelConfig } from "../types";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

// ---------------------------------------------------------------------------
// Visual identity per page type. Each tender bundle is physically assembled
// from tabbed sections (brochure / item spec / SLA) — the small "tab" flag on
// each selected card mirrors that real-world divider, so the UI reads like
// the document it produces rather than a generic form list.
// ---------------------------------------------------------------------------
type PageKind = "brochure" | "item" | "sla" | "other";

const KIND_STYLES: Record<
  PageKind,
  { tab: string; icon: ReactNode; chip: string }
> = {
  brochure: {
    tab: "bg-indigo-600",
    icon: <BookOpen size={14} />,
    chip: "bg-indigo-50 text-indigo-600",
  },
  item: {
    tab: "bg-emerald-600",
    icon: <LayoutGrid size={14} />,
    chip: "bg-emerald-50 text-emerald-600",
  },
  sla: {
    tab: "bg-amber-500",
    icon: <CalendarClock size={14} />,
    chip: "bg-amber-50 text-amber-600",
  },
  other: {
    tab: "bg-slate-500",
    icon: <FileText size={14} />,
    chip: "bg-slate-100 text-slate-600",
  },
};

const getKind = (tplName: string): PageKind => {
  if (tplName.includes("NilaiTambahan")) return "brochure";
  if (tplName.includes("Item_Coverpage")) return "item";
  if (tplName.includes("SLA")) return "sla";
  return "other";
};

export interface BrochureTemplateBoardProps extends CompanyViewProps {
  /** Section title shown above the board, e.g. "ASN — Canon Brochure". */
  title: string;
  /** Short line describing what this board produces. */
  subtitle?: string;
  /** Restrict to specific template filenames (suffix or exact match). Omit to show all. */
  allowedTemplates?: string[];
  /** Sort weight per template keyword; lower shows first. */
  templateOrder?: Record<string, number>;
  /** Custom label resolver; falls back to a sensible default by page kind. */
  getDisplayName?: (tplName: string) => string;
}

export default function BrochureTemplateBoard({
  title,
  subtitle,
  templates,
  selectedItems,
  onAddItem,
  onRemoveItem,
  onFieldChange,
  allowedTemplates,
  templateOrder = {},
  getDisplayName,
}: BrochureTemplateBoardProps) {
  const [printerModels, setPrinterModels] = useState<PrinterModel[]>([]);

  useEffect(() => {
    fetch(`${BASE_URL}/api/Brochure/printer-models`)
      .then(async (res) => {
        if (!res.ok) return [];
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          return res.json();
        }
        return [];
      })
      .then((data) => setPrinterModels(data || []))
      .catch((err) => console.error("Error fetching printer models:", err));
  }, []);

  const resolveDisplayName = useCallback(
    (tpl: string) => {
      if (getDisplayName) return getDisplayName(tpl);
      const kind = getKind(tpl);
      if (kind === "brochure") return "Brochure";
      if (kind === "item") return "Item";
      if (kind === "sla") return "SLA & Gantt";
      return tpl;
    },
    [getDisplayName],
  );

  const visibleTemplates = (
    allowedTemplates
      ? templates.filter((tpl) =>
          allowedTemplates.some((allowed) => tpl.endsWith(allowed) || tpl === allowed),
        )
      : templates
  ).slice();

  const sortedTemplates = visibleTemplates.sort((a, b) => {
    const getOrder = (name: string) => {
      for (const [key, val] of Object.entries(templateOrder)) {
        if (name.includes(key)) return val;
      }
      return 99;
    };
    return getOrder(a) - getOrder(b);
  });

  const selectedCount = selectedItems.length;

  // Sync customer name across every card that carries it (Brochure + SLA).
  const handleCustomerNameChange = (val: string) => {
    selectedItems.forEach((item) => {
      if (item.data["customername"] !== val) {
        onFieldChange(item.instanceId, "customername", val);
      }
      if (item.data["customerName"] !== val) {
        onFieldChange(item.instanceId, "customerName", val);
      }
    });
  };

  const generateModelDetailsText = useCallback(
    (configs: ModelConfig[] = [], models: PrinterModel[] = printerModels) => {
      return configs
        .map((cfg) => {
          const model = models.find((m) => m.model_code === cfg.modelCode);
          if (!model) return "";

          const colorStr = model.is_color
            ? "(HITAM/PUTIH DAN BERWARNA)"
            : "(HITAM/PUTIH)";
          const colorPpmStr = model.is_color ? "Color" : "Monochrome";

          let finisherStr = "";
          if (cfg.finisher === "INNER") finisherStr = "With INNER Finisher\n";
          else if (cfg.finisher === "EXTERNAL STAPLE")
            finisherStr = "With EXTERNAL STAPLE Finisher\n";
          else if (cfg.finisher === "BOOKLET")
            finisherStr = "With BOOKLET Finisher\n";

          return `${cfg.itemLabel}. MESIN PENYALIN JENIS\n${model.duty_type} ${colorStr} - ${cfg.units} UNIT\n\n\n${cfg.units} UNIT ${model.series_name} ${model.model_code}\n${finisherStr}(${model.ppm}PPM, ${colorPpmStr})\n${model.functions}`;
        })
        .filter(Boolean)
        .join("\n\n");
    },
    [printerModels],
  );

  // Keep Item_Coverpage labels (A, B, C…) contiguous across every instance.
  useEffect(() => {
    if (printerModels.length === 0) return;

    let globalIndex = 0;
    selectedItems.forEach((item) => {
      if (
        item.templateName.includes("Item_Coverpage") &&
        item.modelConfigs &&
        item.modelConfigs.length > 0
      ) {
        let hasLabelChanged = false;

        const updatedConfigs = item.modelConfigs.map((cfg) => {
          const expectedLabel = String.fromCharCode(65 + globalIndex);
          globalIndex++;
          if (cfg.itemLabel !== expectedLabel) {
            hasLabelChanged = true;
            return { ...cfg, itemLabel: expectedLabel };
          }
          return cfg;
        });

        const newText = generateModelDetailsText(updatedConfigs, printerModels);
        const modelCodes = Array.from(
          new Set(updatedConfigs.map((c) => c.modelCode).filter(Boolean)),
        );

        if (hasLabelChanged) {
          onFieldChange(item.instanceId, "modelConfigs", updatedConfigs);
        }
        if (item.data["modeldetails"] !== newText) {
          onFieldChange(item.instanceId, "modeldetails", newText);
        }
        if (JSON.stringify(item.modelCodes) !== JSON.stringify(modelCodes)) {
          onFieldChange(item.instanceId, "modelCodes", modelCodes);
        }
      }
    });
  }, [selectedItems.length, printerModels, generateModelDetailsText, onFieldChange, selectedItems]);

  const handleUpdateConfigs = (instanceId: string, updatedConfigs: ModelConfig[]) => {
    onFieldChange(instanceId, "modelConfigs", updatedConfigs);
    onFieldChange(instanceId, "modeldetails", generateModelDetailsText(updatedConfigs));
    onFieldChange(
      instanceId,
      "modelCodes",
      Array.from(new Set(updatedConfigs.map((c) => c.modelCode).filter(Boolean))),
    );
  };

  const getGlobalModelCount = () =>
    selectedItems
      .filter((item) => item.templateName.includes("Item_Coverpage"))
      .reduce((sum, item) => sum + (item.modelConfigs?.length || 0), 0);

  return (
    <div className='space-y-6 max-w-5xl'>
      {/* Board header */}
      <div className='flex items-end justify-between border-b border-slate-200 pb-3'>
        <div>
          <h2 className='text-base font-bold text-slate-900'>{title}</h2>
          {subtitle && <p className='text-xs text-slate-500 mt-0.5'>{subtitle}</p>}
        </div>
        <span className='text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full'>
          {selectedCount} page{selectedCount === 1 ? "" : "s"} selected
        </span>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-5 items-start'>
        {sortedTemplates.map((tpl) => {
          const matchingItems = selectedItems.filter(
            (item) => item.templateName.endsWith(tpl) || item.templateName === tpl,
          );
          const isSelected = matchingItems.length > 0;
          const displayName = resolveDisplayName(tpl);
          const kind = getKind(tpl);
          const style = KIND_STYLES[kind];

          return (
            <div key={tpl} className='flex flex-col space-y-4'>
              {!isSelected ? (
                <label
                  htmlFor={`toggle-${tpl}`}
                  className='group flex items-center justify-between gap-3 cursor-pointer rounded-xl border border-dashed border-slate-300 bg-white px-4 py-4 shadow-sm transition-all hover:border-indigo-300 hover:shadow'
                >
                  <span className='flex items-center gap-3'>
                    <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${style.chip}`}>
                      {style.icon}
                    </span>
                    <span className='text-sm font-semibold text-slate-700'>{displayName}</span>
                  </span>
                  <span className='flex items-center gap-1 text-xs font-medium text-indigo-600 opacity-0 transition-opacity group-hover:opacity-100'>
                    <Plus size={14} /> Add
                  </span>
                  <input
                    id={`toggle-${tpl}`}
                    type='checkbox'
                    checked={false}
                    onChange={(e) => {
                      if (e.target.checked) onAddItem(tpl);
                    }}
                    className='sr-only'
                  />
                </label>
              ) : (
                matchingItems.map((item, index) => {
                  const isNilaiTambahan = kind === "brochure";
                  const isItemCover = kind === "item";
                  const isSLA = kind === "sla";
                  const configs: ModelConfig[] = item.modelConfigs || [];
                  const currentCustomerName =
                    item.data["customername"] || item.data["customerName"] || "";

                  return (
                    <div
                      key={item.instanceId}
                      className='rounded-xl border border-slate-200 bg-white shadow-md overflow-hidden'
                    >
                      {/* Header bar — color-coded per page type, doubles as the divider-tab motif */}
                      <div
                        className={`flex items-center justify-between gap-2 px-4 py-2.5 text-white ${style.tab}`}
                      >
                        <span className='flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide'>
                          {style.icon}
                          {displayName}
                          {matchingItems.length > 1 ? ` #${index + 1}` : ""}
                        </span>
                        <div className='flex items-center gap-0.5'>
                          <button
                            type='button'
                            onClick={() => onAddItem(tpl)}
                            className='rounded p-1 hover:bg-white/20 transition-colors'
                            title='Add another page'
                          >
                            <Plus size={15} />
                          </button>
                          <button
                            type='button'
                            onClick={() => onRemoveItem(item.instanceId)}
                            className='rounded p-1 hover:bg-white/20 transition-colors'
                            title='Remove this page'
                          >
                            <X size={15} />
                          </button>
                        </div>
                      </div>

                      <div className='p-5 space-y-4'>
                        {isNilaiTambahan && (
                          <>
                            <Field label='Customer name'>
                              <input
                                type='text'
                                value={currentCustomerName}
                                onChange={(e) => handleCustomerNameChange(e.target.value)}
                                placeholder='e.g. TESTING SDN BHD'
                                className={inputCls}
                              />
                            </Field>
                            <Field label='Nilai tambahan content'>
                              <textarea
                                rows={4}
                                value={item.data["nilaitambahancontent"] ?? ""}
                                onChange={(e) =>
                                  onFieldChange(item.instanceId, "nilaitambahancontent", e.target.value)
                                }
                                onBlur={(e) => {
                                  if (!e.target.value) {
                                    onFieldChange(item.instanceId, "nilaitambahancontent", " ");
                                  }
                                }}
                                placeholder='Enter nilai tambahan details...'
                                className={inputCls}
                              />
                            </Field>
                          </>
                        )}

                        {isSLA && (
                          <>
                            <Field label='Customer name'>
                              <input
                                type='text'
                                value={currentCustomerName}
                                onChange={(e) => handleCustomerNameChange(e.target.value)}
                                placeholder='e.g. JABATAN PENGANGKUTAN JALAN BANDAR MELAKA'
                                className={inputCls}
                              />
                            </Field>
                            <Field label='Title Gantt chart'>
                              <textarea
                                rows={3}
                                value={item.data["titleGanttChart"] || ""}
                                onChange={(e) =>
                                  onFieldChange(item.instanceId, "titleGanttChart", e.target.value)
                                }
                                placeholder='e.g. SEBUTHARGA PERKHIDMATAN PENYEWAAN & PENYELENGGARAAN...'
                                className={inputCls}
                              />
                            </Field>
                            <Field label='No. SH'>
                              <input
                                type='text'
                                value={item.data["noSH"] || ""}
                                onChange={(e) => onFieldChange(item.instanceId, "noSH", e.target.value)}
                                placeholder='e.g. QT260000000014931'
                                className={inputCls}
                              />
                            </Field>
                          </>
                        )}

                        {isItemCover && (
                          <div className='space-y-4'>
                            <div className='flex items-center justify-between'>
                              <span className='text-xs font-bold text-slate-700'>
                                Model configurations
                              </span>
                              <button
                                type='button'
                                onClick={() => {
                                  const totalCount = getGlobalModelCount();
                                  const nextLabel = String.fromCharCode(65 + totalCount);
                                  const defaultModel = printerModels[0]?.model_code || "";
                                  handleUpdateConfigs(item.instanceId, [
                                    ...configs,
                                    {
                                      id: Date.now().toString(),
                                      itemLabel: nextLabel,
                                      modelCode: defaultModel,
                                      units: 1,
                                      finisher: "NONE",
                                    },
                                  ]);
                                }}
                                className='flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 px-2.5 py-1 rounded-md transition-colors'
                              >
                                <Plus size={13} />
                                Add model
                              </button>
                            </div>

                            {configs.length === 0 && (
                              <p className='text-xs text-slate-400 italic border border-dashed border-slate-200 rounded-lg px-3 py-4 text-center'>
                                No models yet — add one to generate the item text.
                              </p>
                            )}

                            {configs.map((cfg, cfgIdx) => (
                              <div
                                key={cfg.id || cfgIdx}
                                className='rounded-lg border border-slate-200 bg-slate-50 p-3.5 space-y-3'
                              >
                                <div className='flex items-center justify-between'>
                                  <span className='rounded bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-600'>
                                    Item {cfg.itemLabel}
                                  </span>
                                  <button
                                    type='button'
                                    onClick={() =>
                                      handleUpdateConfigs(
                                        item.instanceId,
                                        configs.filter((_, idx) => idx !== cfgIdx),
                                      )
                                    }
                                    className='flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-700 transition-colors'
                                  >
                                    <Trash2 size={12} />
                                    Delete
                                  </button>
                                </div>

                                <div className='grid grid-cols-2 gap-3'>
                                  <Field label='Model code' compact>
                                    <select
                                      value={cfg.modelCode}
                                      onChange={(e) =>
                                        handleUpdateConfigs(
                                          item.instanceId,
                                          configs.map((c, i) =>
                                            i === cfgIdx ? { ...c, modelCode: e.target.value } : c,
                                          ),
                                        )
                                      }
                                      className={selectCls}
                                    >
                                      {printerModels.length === 0 ? (
                                        <option value={cfg.modelCode}>
                                          {cfg.modelCode || "Loading models..."}
                                        </option>
                                      ) : (
                                        printerModels.map((m) => (
                                          <option key={m.id || m.model_code} value={m.model_code}>
                                            {m.series_name} ({m.model_code})
                                          </option>
                                        ))
                                      )}
                                    </select>
                                  </Field>

                                  <Field label='Units' compact>
                                    <input
                                      type='number'
                                      min={1}
                                      value={cfg.units}
                                      onChange={(e) =>
                                        handleUpdateConfigs(
                                          item.instanceId,
                                          configs.map((c, i) =>
                                            i === cfgIdx
                                              ? { ...c, units: parseInt(e.target.value) || 1 }
                                              : c,
                                          ),
                                        )
                                      }
                                      className={selectCls}
                                    />
                                  </Field>
                                </div>

                                <Field label='Finisher option' compact>
                                  <select
                                    value={cfg.finisher}
                                    onChange={(e) =>
                                      handleUpdateConfigs(
                                        item.instanceId,
                                        configs.map((c, i) =>
                                          i === cfgIdx ? { ...c, finisher: e.target.value as any } : c,
                                        ),
                                      )
                                    }
                                    className={selectCls}
                                  >
                                    <option value='NONE'>Without finisher</option>
                                    <option value='INNER'>INNER finisher</option>
                                    <option value='EXTERNAL STAPLE'>EXTERNAL STAPLE finisher</option>
                                    <option value='BOOKLET'>BOOKLET finisher</option>
                                  </select>
                                </Field>
                              </div>
                            ))}

                            <Field label='Generated text (modeldetails)'>
                              <div className='relative'>
                                <span className='absolute right-2 top-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded'>
                                  Auto-generated
                                </span>
                                <textarea
                                  rows={6}
                                  value={item.data["modeldetails"] || ""}
                                  onChange={(e) =>
                                    onFieldChange(item.instanceId, "modeldetails", e.target.value)
                                  }
                                  placeholder='Add a model above to generate details...'
                                  className={`${inputCls} font-mono bg-slate-50 leading-relaxed pt-7`}
                                />
                              </div>
                            </Field>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// --- shared field wrapper + input styles -----------------------------------

const inputCls =
  "w-full text-xs border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all";
const selectCls =
  "w-full text-xs border border-slate-300 rounded-md p-1.5 bg-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all";

function Field({
  label,
  compact,
  children,
}: {
  label: string;
  compact?: boolean;
  children: ReactNode;
}) {
  return (
    <div className='flex flex-col space-y-1'>
      <label className={`font-semibold text-slate-700 ${compact ? "text-[11px]" : "text-xs"}`}>
        {label}
      </label>
      {children}
    </div>
  );
}